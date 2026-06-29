import io
import re
import time
from datetime import datetime

from openai import OpenAI
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from sqlalchemy.orm import Session

from app.config import settings
from app.modules.chat.models import Message, MessageRole
from app.modules.knowledge.services import get_knowledge_base_text

# Simple in-memory cache for expensive AI calls
_cache: dict[str, tuple[float, dict]] = {}
CACHE_TTL = 3600  # 1 hour


def get_cached(key: str) -> dict | None:
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < CACHE_TTL:
            return data
        del _cache[key]
    return None


def set_cached(key: str, data: dict):
    _cache[key] = (time.time(), data)


def clear_cache(prefix: str = ""):
    keys_to_remove = [k for k in _cache if k.startswith(prefix)]
    for k in keys_to_remove:
        del _cache[k]


SYSTEM_PROMPT_TEMPLATE = """You are a senior UK mortgage adviser AI assistant with 20+ years of experience in the UK mortgage market. You have extensive knowledge of residential mortgages, buy-to-let, remortgages, lender criteria, affordability calculations, and government schemes.

Your role is to:
1. Analyze the user's uploaded financial documents (payslips, bank statements, tax returns, etc.)
2. Build a comprehensive understanding of their financial situation and mortgage readiness
3. Provide actionable mortgage advice with SPECIFIC NUMBERS, rates, and lender names
4. Calculate affordability and suggest suitable mortgage products
5. Identify potential issues (credit, affordability, documentation gaps)
6. Recommend the best approach for their specific circumstances

You have access to the following knowledge base from the user's documents:
{knowledge_base}

CRITICAL FORMATTING RULES -- the user is NOT a mortgage professional, so you MUST:

1. **Always include specific numbers and lender names** -- never give vague advice. Show exact monthly payments, interest rates, and name specific lenders. For example: "With Halifax at 4.49% fixed for 2 years on a £200,000 mortgage over 25 years, your monthly payment would be £1,109" not just "you could get a competitive rate".

2. **Present 2-3 different mortgage options** -- label them clearly (e.g., "Option A: 2-Year Fixed", "Option B: 5-Year Fixed", "Option C: Tracker") with a comparison showing:
   - Lender name and product
   - Interest rate and type (fixed/tracker/SVR)
   - Monthly payment amount
   - Total cost over the fixed period
   - Product fees
   - Early repayment charges
   - Key advantages and disadvantages

3. **Use current UK mortgage market knowledge**:
   - Income multiples: typically 4-4.5x salary, some lenders up to 5.5x
   - LTV tiers: 60%, 75%, 85%, 90%, 95% -- rates improve with lower LTV
   - Stress testing: lenders typically stress test at SVR + 3% or a minimum of around 7-8%
   - Affordability: based on net disposable income after committed expenditure
   - Credit scoring: explain impact of defaults, CCJs, missed payments
   - Stamp Duty Land Tax thresholds and rates

4. **Show worked calculations** -- e.g., "Property: £250,000, Deposit: £25,000 (10%), Mortgage: £225,000, LTV: 90%, Monthly payment at 4.49%: £1,248, Stamp Duty: £2,500"

5. **Include key dates and deadlines** -- e.g., "Mortgage offers typically valid for 6 months", "Exchange usually 4-8 weeks after offer", "Stamp duty due within 14 days of completion"

6. **First-time buyer schemes** -- when relevant, always mention:
   - Lifetime ISA (LISA): 25% government bonus up to £1,000/year on savings up to £4,000
   - Shared Ownership: buy 25-75% share, rent remainder
   - First Homes: 30-50% discount on new-build homes
   - Right to Buy: for council/housing association tenants
   - Help to Build: for self-build projects
   - 95% LTV guarantee scheme

7. **ALWAYS end with 3 suggested follow-up questions** -- After your answer, add a section:
   ---
   **You might also want to ask:**
   1. [A specific follow-up question that digs deeper into the topic you just discussed]
   2. [A related question about a different aspect of their mortgage journey]
   3. [A practical "what should I do next" question to help them take action]

   Make these questions specific to the user's documents and situation, not generic. Include amounts or rates where relevant.

IMPORTANT DISCLAIMERS (include briefly at the end, not at the start):
- This is AI-generated advice -- consult a qualified mortgage broker before making decisions
- Rates and products change daily -- verify current availability with lenders
- Your specific circumstances may affect eligibility"""

FTB_AGENT_PROMPT = """You are a UK first-time buyer specialist AI. Focus on:
- First-time buyer mortgage products and their advantages
- Government schemes: LISA, Shared Ownership, First Homes, Help to Build
- Stamp Duty Land Tax relief for first-time buyers (0% up to £425,000, 5% on £425,001-£625,000)
- Saving strategies for deposits
- Mortgage in Principle (MIP/AIP) process
- The full home-buying process from search to completion
- Common first-time buyer mistakes to avoid
- Shared ownership vs full ownership comparison
Always include specific lender names, rates, and payment amounts.

You have access to the following knowledge base from the user's documents:
{knowledge_base}

CRITICAL FORMATTING RULES -- the user is NOT a mortgage professional, so you MUST:

1. **Always include specific numbers and lender names** -- never give vague advice.

2. **Present step-by-step guides** with timelines, costs, and deadlines.

3. **Use current UK mortgage market knowledge** including first-time buyer specific rates and schemes.

4. **Show worked calculations** -- e.g., "LISA: Save £4,000/year for 4 years = £16,000 + £4,000 government bonus = £20,000"

5. **Include key dates and deadlines** relevant to their purchase timeline.

6. **End every response with a clear recommendation** -- "Based on your situation, I recommend..."

7. **ALWAYS end with 3 suggested follow-up questions** specific to their situation.

IMPORTANT DISCLAIMERS (include briefly at the end, not at the start):
- This is AI-generated advice -- consult a qualified mortgage broker before making decisions
- Rates and products change daily -- verify current availability with lenders
- Your specific circumstances may affect eligibility"""

BTL_AGENT_PROMPT = """You are a UK buy-to-let mortgage specialist AI. Focus on:
- Buy-to-let mortgage criteria and minimum income requirements
- Rental income calculations (typically 125-145% of monthly mortgage payment at a stress rate)
- Portfolio landlord rules (4+ mortgaged BTL properties)
- Tax implications: Section 24 mortgage interest relief restriction
- Stamp Duty surcharge (3% additional on BTL properties)
- Limited company SPV vs personal ownership comparison
- HMO and multi-unit freehold blocks
- EPC requirements and minimum energy efficiency standards
- Landlord insurance and regulatory requirements
Always include specific lender names, rates, and rental yield calculations.

You have access to the following knowledge base from the user's documents:
{knowledge_base}

CRITICAL FORMATTING RULES -- the user is NOT a mortgage professional, so you MUST:

1. **Always include specific numbers and lender names** -- never give vague advice.

2. **Present rental yield calculations** showing gross yield, net yield, and cash-on-cash return.

3. **Compare personal vs limited company ownership** with specific tax calculations.

4. **Show worked calculations** -- e.g., "Property: £200,000, Rent: £950/month, Gross yield: 5.7%, Mortgage at 5.5%: £731/month, ICR: 130%"

5. **Include Stamp Duty with 3% surcharge** -- e.g., "£200,000 BTL: £7,500 standard + £6,000 surcharge = £13,500 total"

6. **End every response with a clear recommendation**

7. **ALWAYS end with 3 suggested follow-up questions** specific to their BTL situation.

IMPORTANT DISCLAIMERS (include briefly at the end, not at the start):
- This is AI-generated advice -- consult a qualified mortgage broker before making decisions
- Rates and products change daily -- verify current availability with lenders
- Your specific circumstances may affect eligibility"""

AGENT_PROMPTS = {
    "mortgage": SYSTEM_PROMPT_TEMPLATE,
    "ftb": FTB_AGENT_PROMPT,
    "btl": BTL_AGENT_PROMPT,
}


def get_openai_client() -> OpenAI:
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def build_system_prompt(
    db: Session, consultation_id: int, agent: str = "mortgage"
) -> str:
    knowledge_base = get_knowledge_base_text(db, consultation_id)
    template = AGENT_PROMPTS.get(agent, SYSTEM_PROMPT_TEMPLATE)
    return template.format(knowledge_base=knowledge_base)


def get_conversation_history(
    db: Session, consultation_id: int, limit: int = 50
) -> list[dict]:
    messages = (
        db.query(Message)
        .filter(Message.consultation_id == consultation_id)
        .order_by(Message.created_at.asc())
        .limit(limit)
        .all()
    )
    return [{"role": msg.role.value, "content": msg.content} for msg in messages]


def save_message(
    db: Session,
    consultation_id: int,
    user_id: int,
    role: MessageRole,
    content: str,
) -> Message:
    message = Message(
        consultation_id=consultation_id,
        user_id=user_id,
        role=role,
        content=content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def chat_completion(
    db: Session,
    consultation_id: int,
    user_id: int,
    user_message: str,
    agent: str = "mortgage",
) -> Message:
    # Save user message
    save_message(db, consultation_id, user_id, MessageRole.USER, user_message)

    # Build messages for OpenAI
    system_prompt = build_system_prompt(db, consultation_id, agent=agent)
    history = get_conversation_history(db, consultation_id)

    openai_messages = [{"role": "system", "content": system_prompt}] + history

    # Call OpenAI
    client = get_openai_client()
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=openai_messages,
        max_tokens=2000,
        temperature=0.7,
    )

    assistant_content = response.choices[0].message.content

    # Save assistant message
    assistant_message = save_message(
        db, consultation_id, user_id, MessageRole.ASSISTANT, assistant_content
    )

    return assistant_message


def chat_completion_stream(
    db: Session,
    consultation_id: int,
    user_id: int,
    user_message: str,
    agent: str = "mortgage",
):
    """Generator that yields streaming chunks from OpenAI."""
    # Save user message
    save_message(db, consultation_id, user_id, MessageRole.USER, user_message)

    # Build messages for OpenAI
    system_prompt = build_system_prompt(db, consultation_id, agent=agent)
    history = get_conversation_history(db, consultation_id)

    openai_messages = [{"role": "system", "content": system_prompt}] + history

    # Call OpenAI with streaming
    client = get_openai_client()
    stream = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=openai_messages,
        max_tokens=2000,
        temperature=0.7,
        stream=True,
    )

    full_response = ""
    for chunk in stream:
        if chunk.choices[0].delta.content:
            content = chunk.choices[0].delta.content
            full_response += content
            yield content

    # Save the complete assistant message
    save_message(db, consultation_id, user_id, MessageRole.ASSISTANT, full_response)


# ---------- Mortgage Calculator (no AI needed) ----------


def calculate_stamp_duty(property_value: int, first_time_buyer: bool = True) -> int:
    """Calculate UK Stamp Duty Land Tax in pence.

    First-time buyer relief: 0% up to £425,000, 5% on £425,001-£625,000.
    No relief if property > £625,000 (standard rates apply).

    Standard rates:
    - 0% up to £250,000
    - 5% on £250,001-£925,000
    - 10% on £925,001-£1,500,000
    - 12% on £1,500,001+
    """
    value = property_value  # already in pence conceptually, but we treat as pounds here

    if first_time_buyer and value <= 625000:
        # First-time buyer rates
        if value <= 425000:
            return 0
        else:
            return int((value - 425000) * 0.05) * 100  # convert to pence
    else:
        # Standard rates
        duty = 0
        if value > 1500000:
            duty += (value - 1500000) * 0.12
            value = 1500000
        if value > 925000:
            duty += (value - 925000) * 0.10
            value = 925000
        if value > 250000:
            duty += (value - 250000) * 0.05
            value = 250000
        return int(duty) * 100  # convert to pence


def calculate_mortgage(
    property_value: int,
    deposit: int,
    term_years: int,
    interest_rate: float,
    first_time_buyer: bool = True,
) -> dict:
    """Calculate mortgage repayment details. All monetary values in pence."""
    loan_amount = property_value - deposit
    ltv_ratio = (
        round((loan_amount / property_value) * 100, 1) if property_value > 0 else 0
    )

    # Monthly payment calculation (annuity formula)
    monthly_rate = interest_rate / 100 / 12
    num_payments = term_years * 12

    if monthly_rate > 0:
        monthly_payment = (
            loan_amount
            * (monthly_rate * (1 + monthly_rate) ** num_payments)
            / ((1 + monthly_rate) ** num_payments - 1)
        )
    else:
        monthly_payment = loan_amount / num_payments

    total_cost = monthly_payment * num_payments
    total_interest = total_cost - loan_amount

    stamp_duty = calculate_stamp_duty(property_value, first_time_buyer)

    return {
        "monthly_payment": int(round(monthly_payment * 100)),  # pence
        "total_interest": int(round(total_interest * 100)),  # pence
        "total_cost": int(round(total_cost * 100)),  # pence
        "ltv_ratio": ltv_ratio,
        "stamp_duty": stamp_duty,
        "loan_amount": loan_amount * 100,  # pence
    }


# ---------- Readiness Score (no AI needed) ----------

COMMON_DOCS = [
    {"category": "id", "label": "Passport / Photo ID"},
    {
        "category": "address",
        "label": "Proof of address (utility bill or driving licence)",
    },
    {
        "category": "deposit",
        "label": "Proof of deposit (bank statements showing savings)",
    },
    {"category": "credit_report", "label": "Credit report"},
]

EMPLOYED_DOCS = [
    {"category": "employment", "label": "Contract of employment"},
    {"category": "tax_returns", "label": "Latest P60 or P45"},
    {"category": "payslips", "label": "Latest 3 months payslips"},
    {"category": "bank_statements", "label": "Bank statements (3 months)"},
]

SELF_EMPLOYED_DOCS = [
    {"category": "tax_returns", "label": "SA302 + Tax Year Overview (2 years)"},
    {"category": "bank_statements", "label": "Bank statements (6 months)"},
]

CIS_CONTRACTOR_DOCS = [
    {"category": "employment", "label": "CIS start date / registration"},
    {"category": "tax_returns", "label": "SA302 + Tax Year Overview (1 year)"},
    {"category": "payslips", "label": "Latest 3 months payslips"},
    {"category": "bank_statements", "label": "Bank statements (3 months)"},
]

COMPANY_DIRECTOR_DOCS = [
    {"category": "tax_returns", "label": "SA302 + Tax Year Overview (2 years)"},
    {"category": "company_accounts", "label": "Annual company accounts (2 years)"},
]

EMPLOYMENT_DOCS = {
    "employed": EMPLOYED_DOCS,
    "self_employed": SELF_EMPLOYED_DOCS,
    "cis_contractor": CIS_CONTRACTOR_DOCS,
    "company_director": COMPANY_DIRECTOR_DOCS,
}


def calculate_readiness(db: Session, user_id: int, consultation_id: int) -> dict:
    """Check which documents user has uploaded vs what's required for their employment type."""
    from app.modules.users.models import User
    from app.modules.documents.models import Document

    user = db.query(User).filter(User.id == user_id).first()
    employment_type = user.employment_type if user else "employed"
    if not employment_type:
        employment_type = "employed"

    # Get all document checklist categories for this consultation
    documents = (
        db.query(Document).filter(Document.consultation_id == consultation_id).all()
    )
    uploaded_categories = set()
    uploaded_docs_by_category: dict[str, list[str]] = {}
    for doc in documents:
        cat = doc.checklist_category or "other"
        uploaded_categories.add(cat)
        uploaded_docs_by_category.setdefault(cat, []).append(doc.filename)

    # Build required checklist
    required_docs = COMMON_DOCS + EMPLOYMENT_DOCS.get(employment_type, EMPLOYED_DOCS)

    checklist = []
    missing = []
    uploaded_count = 0

    # Categories that can satisfy other categories
    # e.g., bank_statements can count as deposit proof
    CATEGORY_ALIASES = {
        "deposit": {"deposit", "bank_statements"},
        "bank_statements": {"bank_statements", "deposit"},
        "address": {"address", "id"},
        "income": {"income", "tax_returns", "payslips", "employment"},
    }

    for item in required_docs:
        cat = item["category"]
        # Check if this category or any alias has been uploaded
        matching_categories = CATEGORY_ALIASES.get(cat, {cat})
        matched = matching_categories & uploaded_categories
        if matched:
            # Collect docs from all matching categories
            matched_docs = []
            for mc in matched:
                matched_docs.extend(uploaded_docs_by_category.get(mc, []))
            checklist.append(
                {
                    "category": cat,
                    "label": item["label"],
                    "status": "uploaded",
                    "documents": matched_docs,
                }
            )
            uploaded_count += 1
        else:
            checklist.append(
                {
                    "category": cat,
                    "label": item["label"],
                    "status": "missing",
                    "documents": [],
                }
            )
            missing.append(item["label"])

    total_required = len(required_docs)
    overall_percentage = (
        int(round((uploaded_count / total_required) * 100)) if total_required > 0 else 0
    )

    return {
        "overall_percentage": overall_percentage,
        "checklist": checklist,
        "missing_documents": missing,
        "employment_type": employment_type,
    }


# ---------- Bank Comparison (uses AI) ----------


def compare_banks(
    db: Session,
    consultation_id: int,
    user_id: int,
    property_value: int,
    deposit: int,
    annual_income: int,
    employment_type: str,
    term_years: int,
    first_time_buyer: bool,
) -> list[dict]:
    """Use OpenAI to suggest top 5 lender recommendations."""
    import json as _json

    loan_amount = property_value - deposit
    ltv = round((loan_amount / property_value) * 100, 1) if property_value > 0 else 0

    knowledge_base = get_knowledge_base_text(db, consultation_id)

    prompt = (
        "Based on the following UK mortgage application details, recommend the TOP 5 best lenders "
        "with specific products, rates, and monthly payments. Use your knowledge of current UK mortgage market.\n\n"
        f"Property value: £{property_value:,}\n"
        f"Deposit: £{deposit:,}\n"
        f"Loan amount: £{loan_amount:,}\n"
        f"LTV: {ltv}%\n"
        f"Annual income: £{annual_income:,}\n"
        f"Employment type: {employment_type}\n"
        f"Term: {term_years} years\n"
        f"First-time buyer: {'Yes' if first_time_buyer else 'No'}\n\n"
        f"User's document knowledge base:\n{knowledge_base}\n\n"
        "Return ONLY valid JSON array with no markdown, no code fences:\n"
        '[{"lender_name": "...", "product_type": "2-Year Fixed|5-Year Fixed|Tracker|...", '
        '"interest_rate": 4.49, "monthly_payment": 1109, "term_years": 25, '
        '"ltv": 90.0, "total_cost": 332700, "fees": 999, '
        '"reason": "Why this lender suits this applicant"}]\n\n'
        "Include realistic UK lenders like Halifax, Nationwide, Barclays, HSBC, NatWest, "
        "Santander, Virgin Money, Skipton, Leeds BS, Accord, etc. "
        "Monthly payment and total_cost should be in pounds (not pence). "
        "Fees should be the product fee in pounds."
    )

    client = get_openai_client()
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1500,
        temperature=0.4,
    )

    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

    try:
        data = _json.loads(raw)
    except _json.JSONDecodeError:
        data = []

    if not isinstance(data, list):
        data = []

    # Validate and normalize each recommendation
    recommendations = []
    for item in data[:5]:
        if not isinstance(item, dict):
            continue
        recommendations.append(
            {
                "lender_name": str(item.get("lender_name", "Unknown")),
                "product_type": str(item.get("product_type", "Fixed")),
                "interest_rate": float(item.get("interest_rate", 0)),
                "monthly_payment": int(item.get("monthly_payment", 0))
                * 100,  # to pence
                "term_years": int(item.get("term_years", term_years)),
                "ltv": float(item.get("ltv", ltv)),
                "total_cost": int(item.get("total_cost", 0)) * 100,  # to pence
                "fees": int(item.get("fees", 0)) * 100,  # to pence
                "reason": str(item.get("reason", "")),
            }
        )

    return recommendations


# ---------- Broker Briefing ----------


def generate_broker_briefing(db: Session, consultation_id: int) -> str:
    """Compile a briefing document that a real mortgage broker can quickly review."""
    knowledge_base = get_knowledge_base_text(db, consultation_id)

    # Get all assistant messages
    assistant_messages = (
        db.query(Message)
        .filter(
            Message.consultation_id == consultation_id,
            Message.role == MessageRole.ASSISTANT,
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    # Get user messages for context
    user_messages = (
        db.query(Message)
        .filter(
            Message.consultation_id == consultation_id,
            Message.role == MessageRole.USER,
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    # Build advice summary from AI responses
    advice_text = ""
    for i, msg in enumerate(assistant_messages[:5], 1):
        advice_text += f"\n--- AI Response {i} ---\n{msg.content[:2000]}\n"

    # Build questions summary
    questions_text = ""
    for msg in user_messages[:10]:
        questions_text += f"- {msg.content[:200]}\n"

    briefing = f"""PROFESSIONAL MORTGAGE BROKER REVIEW BRIEFING
=============================================
Consultation #{consultation_id}
Generated: {datetime.utcnow().strftime("%d %B %Y %H:%M UTC")}

1. CLIENT QUESTIONS
-------------------
{questions_text if questions_text else "No questions recorded yet."}

2. KNOWLEDGE BASE (FROM UPLOADED DOCUMENTS)
-------------------------------------------
{knowledge_base}

3. AI-GENERATED MORTGAGE ADVICE (REQUIRES YOUR REVIEW)
------------------------------------------------------
{advice_text if advice_text else "No AI advice generated yet."}

4. REVIEW CHECKLIST
-------------------
- [ ] Verify affordability calculations against actual lender criteria
- [ ] Check income multiples and stress test rates
- [ ] Validate recommended lender products are currently available
- [ ] Confirm LTV and deposit calculations
- [ ] Review document checklist completeness
- [ ] Assess any credit issues or affordability concerns
- [ ] Check stamp duty calculations
- [ ] Verify eligibility for any recommended government schemes
- [ ] Provide written feedback and corrections

END OF BRIEFING
"""
    return briefing


def get_consultation_messages(
    db: Session, consultation_id: int, skip: int = 0, limit: int = 100
) -> tuple[list[Message], int]:
    query = db.query(Message).filter(Message.consultation_id == consultation_id)
    total = query.count()
    messages = query.order_by(Message.created_at.asc()).offset(skip).limit(limit).all()
    return messages, total


def _escape(text: str) -> str:
    """Escape text for ReportLab XML."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _md_to_elements(md_text: str, styles: dict) -> list:
    """Convert markdown-formatted AI response text to ReportLab flowable elements."""
    elements = []
    lines = md_text.split("\n")
    i = 0
    table_rows = []

    while i < len(lines):
        line = lines[i].rstrip()

        # Skip empty lines
        if not line.strip():
            if table_rows:
                elements.extend(_build_table(table_rows, styles))
                table_rows = []
            i += 1
            continue

        # Markdown table row
        if "|" in line and line.strip().startswith("|"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if all(re.match(r"^[-:]+$", c) for c in cells):
                i += 1
                continue
            table_rows.append(cells)
            i += 1
            continue

        if table_rows:
            elements.extend(_build_table(table_rows, styles))
            table_rows = []

        stripped = line.strip()

        if stripped.startswith("### "):
            text = _escape(stripped[4:])
            text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
            elements.append(Paragraph(text, styles["h3"]))
        elif stripped.startswith("## "):
            text = _escape(stripped[3:])
            text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
            elements.append(Paragraph(text, styles["h2"]))
        elif stripped.startswith("# "):
            text = _escape(stripped[2:])
            text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
            elements.append(Paragraph(text, styles["h1"]))
        elif re.match(r"^\d+[\.\)]\s", stripped):
            text = _escape(re.sub(r"^\d+[\.\)]\s*", "", stripped))
            text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
            num = re.match(r"^(\d+)", stripped).group(1)
            elements.append(Paragraph(f"<b>{num}.</b>  {text}", styles["list_item"]))
        elif stripped.startswith("- ") or stripped.startswith("* "):
            text = _escape(stripped[2:])
            text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
            elements.append(Paragraph(f"\u2022  {text}", styles["bullet"]))
        elif stripped.startswith("**") and stripped.endswith("**"):
            text = _escape(stripped[2:-2])
            elements.append(Paragraph(f"<b>{text}</b>", styles["bold_body"]))
        else:
            text = _escape(stripped)
            text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
            text = re.sub(
                r"`(.+?)`",
                r'<font face="Courier" size="9" color="#2d4a7c">\1</font>',
                text,
            )
            elements.append(Paragraph(text, styles["body"]))

        i += 1

    if table_rows:
        elements.extend(_build_table(table_rows, styles))

    return elements


def _build_table(rows: list[list[str]], styles: dict) -> list:
    """Build a styled ReportLab Table from parsed markdown table rows."""
    if not rows:
        return []

    navy = HexColor("#1a365d")
    light_blue = HexColor("#eef2f8")
    border_color = HexColor("#c8d4e3")
    white = HexColor("#ffffff")

    max_cols = max(len(r) for r in rows)
    table_data = []
    for ri, row in enumerate(rows):
        padded = row + [""] * (max_cols - len(row))
        style = styles["table_header"] if ri == 0 else styles["table_cell"]
        table_data.append([Paragraph(_escape(cell), style) for cell in padded])

    page_width = A4[0] - 40 * mm
    col_width = page_width / max_cols

    table = Table(table_data, colWidths=[col_width] * max_cols)

    table_style_commands = [
        ("BACKGROUND", (0, 0), (-1, 0), navy),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, border_color),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]

    for ri in range(1, len(table_data)):
        if ri % 2 == 0:
            table_style_commands.append(("BACKGROUND", (0, ri), (-1, ri), light_blue))

    table.setStyle(TableStyle(table_style_commands))

    return [Spacer(1, 3 * mm), table, Spacer(1, 3 * mm)]


def _section_heading(elements: list, text: str, s: dict, accent):
    """Append a styled section heading with accent underline."""
    elements.append(Paragraph(text, s["h1"]))
    elements.append(
        HRFlowable(
            width="100%",
            thickness=1,
            color=accent,
            spaceBefore=0,
            spaceAfter=4 * mm,
        )
    )


def _styled_table(rows: list[list[str]], col_widths: list, navy, light_bg):
    """Build a consistently styled table from raw string rows (first row = header)."""
    border_color = HexColor("#c8d4e3")
    white = HexColor("#ffffff")

    table = Table(rows, colWidths=col_widths)
    cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), navy),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, border_color),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, light_bg]),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    table.setStyle(TableStyle(cmds))
    return table


def _ai_generate_report_analysis(
    knowledge_text: str, conversation_summary: str, user_profile: dict
) -> dict:
    """Call OpenAI once to generate the executive summary, challenges, and recommendations.

    Returns a dict with keys: executive_summary, overall_position, challenges, recommendations,
    property_details, income_data, credit_summary, savings_data.
    """
    import json as _json

    prompt = f"""You are a senior UK mortgage adviser writing a professional Mortgage Readiness Assessment report.

Based on the knowledge base and conversation below, produce a structured JSON analysis.

KNOWLEDGE BASE (from uploaded documents):
{knowledge_text[:6000]}

CONVERSATION SUMMARY:
{conversation_summary[:3000]}

USER PROFILE:
- Name: {user_profile.get("full_name", "Not provided")}
- Employment type: {user_profile.get("employment_type", "Not provided")}
- Stated annual income: {user_profile.get("annual_income", "Not provided")}
- Property value: {user_profile.get("property_value", "Not provided")}
- Deposit amount: {user_profile.get("deposit_amount", "Not provided")}
- First-time buyer: {user_profile.get("first_time_buyer", "Not provided")}

Return ONLY valid JSON (no markdown fences) with this exact structure:
{{
  "executive_summary": "4-6 sentence professional summary of mortgage readiness. Include specific numbers. End with overall position.",
  "overall_position": "STRONG|MODERATE|NEEDS WORK",
  "property_details": {{
    "address": "address if mentioned or null",
    "type": "property type if mentioned or null",
    "offer_price": "price if mentioned or null",
    "stamp_duty": "estimated stamp duty or null"
  }},
  "income_data": [
    {{
      "applicant": "Name or Applicant 1",
      "employment_type": "employed/self_employed/company_director/cis_contractor",
      "role": "job title if known or null",
      "company": "company name if known or null",
      "tax_years": [
        {{"year": "2023/24", "salary": "amount or null", "dividends": "amount or null", "total_income": "amount or null", "tax_due": "amount or null"}}
      ]
    }}
  ],
  "credit_summary": {{
    "score": "credit score if mentioned or null",
    "key_points": ["point 1", "point 2"]
  }},
  "savings_data": [
    {{"account": "account name", "balance": "amount", "date": "date if known or null"}}
  ],
  "challenges": ["challenge 1 - be specific to their situation", "challenge 2", "challenge 3"],
  "recommendations": {{
    "immediate": ["numbered action 1", "numbered action 2", "numbered action 3"],
    "strengthen": ["action to strengthen position 1", "action 2"],
    "lender_suggestions": ["Lender 1 - reason", "Lender 2 - reason"]
  }}
}}

Be specific to this applicant's situation. Extract real numbers from the knowledge base where available.
If data is not available, use null rather than making up numbers.
"""

    try:
        client = get_openai_client()
        resp = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.3,
        )
        raw = resp.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
        return _json.loads(raw)
    except Exception:
        return {}


def generate_strategy_report_pdf(
    db: Session, consultation_id: int, title: str
) -> bytes:
    """Generate a professional Mortgage Readiness Assessment PDF report."""
    from app.modules.users.models import User
    from app.modules.payments.models import Consultation

    # ---- Gather data ----
    consultation = (
        db.query(Consultation).filter(Consultation.id == consultation_id).first()
    )
    user_id = consultation.user_id if consultation else None
    user = db.query(User).filter(User.id == user_id).first() if user_id else None

    user_profile = {
        "full_name": user.full_name if user else "Applicant",
        "employment_type": user.employment_type if user else "employed",
        "annual_income": f"\u00a3{user.annual_income:,}"
        if user and user.annual_income
        else None,
        "property_value": f"\u00a3{user.property_value:,}"
        if user and user.property_value
        else None,
        "deposit_amount": f"\u00a3{user.deposit_amount:,}"
        if user and user.deposit_amount
        else None,
        "first_time_buyer": user.first_time_buyer if user else True,
    }

    messages = (
        db.query(Message)
        .filter(
            Message.consultation_id == consultation_id,
            Message.role == MessageRole.ASSISTANT,
        )
        .order_by(Message.created_at.asc())
        .all()
    )
    knowledge_text = get_knowledge_base_text(db, consultation_id)

    # Readiness checklist
    readiness = calculate_readiness(db, user_id, consultation_id) if user_id else None

    # Build conversation summary for AI
    conversation_summary = ""
    for msg in messages[:5]:
        conversation_summary += msg.content[:1500] + "\n---\n"

    # AI analysis (single call for summary, challenges, recommendations)
    analysis = _ai_generate_report_analysis(
        knowledge_text, conversation_summary, user_profile
    )

    # Borrowing capacity from profile
    annual_income_raw = user.annual_income if user and user.annual_income else None

    # ---- PDF Setup ----
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=25 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
    )

    base_styles = getSampleStyleSheet()

    navy = HexColor("#1a365d")
    dark_blue = HexColor("#2d4a7c")
    medium_blue = HexColor("#4a6fa5")
    accent = HexColor("#3b82f6")
    dark_text = HexColor("#1f2937")
    muted_text = HexColor("#6b7280")
    light_bg = HexColor("#f0f4f8")

    s = {
        "title": ParagraphStyle(
            "RptTitle",
            parent=base_styles["Title"],
            fontSize=26,
            textColor=navy,
            spaceAfter=3 * mm,
            leading=32,
        ),
        "subtitle": ParagraphStyle(
            "RptSubtitle",
            parent=base_styles["Normal"],
            fontSize=11,
            textColor=muted_text,
            spaceAfter=8 * mm,
        ),
        "h1": ParagraphStyle(
            "RptH1",
            parent=base_styles["Heading1"],
            fontSize=18,
            textColor=navy,
            spaceBefore=10 * mm,
            spaceAfter=4 * mm,
            borderWidth=0,
            borderPadding=0,
        ),
        "h2": ParagraphStyle(
            "RptH2",
            parent=base_styles["Heading2"],
            fontSize=14,
            textColor=dark_blue,
            spaceBefore=6 * mm,
            spaceAfter=3 * mm,
        ),
        "h3": ParagraphStyle(
            "RptH3",
            parent=base_styles["Heading3"],
            fontSize=11,
            textColor=medium_blue,
            spaceBefore=4 * mm,
            spaceAfter=2 * mm,
        ),
        "body": ParagraphStyle(
            "RptBody",
            parent=base_styles["Normal"],
            fontSize=10,
            leading=15,
            textColor=dark_text,
            spaceAfter=2 * mm,
        ),
        "bold_body": ParagraphStyle(
            "RptBoldBody",
            parent=base_styles["Normal"],
            fontSize=10,
            leading=15,
            textColor=dark_text,
            spaceAfter=2 * mm,
        ),
        "bullet": ParagraphStyle(
            "RptBullet",
            parent=base_styles["Normal"],
            fontSize=10,
            leading=15,
            textColor=dark_text,
            leftIndent=12,
            spaceAfter=1.5 * mm,
        ),
        "list_item": ParagraphStyle(
            "RptListItem",
            parent=base_styles["Normal"],
            fontSize=10,
            leading=15,
            textColor=dark_text,
            leftIndent=12,
            spaceAfter=1.5 * mm,
        ),
        "question": ParagraphStyle(
            "RptQuestion",
            parent=base_styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=muted_text,
            leftIndent=6,
            borderColor=HexColor("#e5e7eb"),
            borderWidth=0,
            spaceAfter=2 * mm,
            fontName="Helvetica-Oblique",
        ),
        "table_header": ParagraphStyle(
            "RptTableHeader",
            parent=base_styles["Normal"],
            fontSize=9,
            leading=12,
            textColor=HexColor("#ffffff"),
            fontName="Helvetica-Bold",
        ),
        "table_cell": ParagraphStyle(
            "RptTableCell",
            parent=base_styles["Normal"],
            fontSize=9,
            leading=12,
            textColor=dark_text,
        ),
        "disclaimer": ParagraphStyle(
            "RptDisclaimer",
            parent=base_styles["Normal"],
            fontSize=7.5,
            textColor=muted_text,
            leading=10,
            spaceBefore=8 * mm,
        ),
        "brand": ParagraphStyle(
            "RptBrand",
            parent=base_styles["Normal"],
            fontSize=9,
            textColor=accent,
            alignment=TA_CENTER,
        ),
        "brand_sub": ParagraphStyle(
            "RptBrandSub",
            parent=base_styles["Normal"],
            fontSize=8,
            textColor=muted_text,
            alignment=TA_CENTER,
        ),
        "footer_line": ParagraphStyle(
            "RptFooterLine",
            parent=base_styles["Normal"],
            fontSize=8,
            textColor=muted_text,
            alignment=TA_RIGHT,
        ),
    }

    summary_box_style = ParagraphStyle(
        "SummaryBox",
        parent=s["body"],
        fontSize=10,
        leading=16,
        textColor=navy,
        backColor=HexColor("#eef2f8"),
        borderColor=accent,
        borderWidth=1,
        borderPadding=12,
        spaceAfter=6 * mm,
    )

    elements = []

    # ================================================================
    # SECTION 1: Cover / Header
    # ================================================================
    elements.append(Spacer(1, 15 * mm))
    elements.append(Paragraph("AI Mortgage Adviser", s["brand"]))
    elements.append(Paragraph("Powered by Advanced AI Technology", s["brand_sub"]))
    elements.append(Spacer(1, 10 * mm))
    elements.append(
        HRFlowable(
            width="100%", thickness=2, color=accent, spaceBefore=0, spaceAfter=5 * mm
        )
    )
    elements.append(Paragraph("Mortgage Readiness Assessment", s["title"]))

    applicant_name = user_profile["full_name"] or "Applicant"
    elements.append(
        Paragraph(
            f"Prepared for: <b>{_escape(applicant_name)}</b>",
            s["body"],
        )
    )
    elements.append(
        Paragraph(
            f"Generated on {datetime.utcnow().strftime('%d %B %Y')}  \u2022  "
            f"Consultation #{consultation_id}",
            s["subtitle"],
        )
    )
    elements.append(
        Paragraph(
            "IMPORTANT: This document is for informational purposes only and does not "
            "constitute regulated mortgage advice. Always consult an FCA-regulated mortgage "
            "adviser before making financial decisions.",
            s["disclaimer"],
        )
    )
    elements.append(
        HRFlowable(
            width="100%",
            thickness=0.5,
            color=HexColor("#e5e7eb"),
            spaceBefore=2 * mm,
            spaceAfter=5 * mm,
        )
    )

    # ================================================================
    # SECTION 2: Property Details
    # ================================================================
    prop = analysis.get("property_details", {})
    has_property = any(
        v and v != "null"
        for v in [
            prop.get("address"),
            prop.get("type"),
            prop.get("offer_price"),
            user_profile.get("property_value"),
        ]
    )

    if has_property:
        _section_heading(elements, "1. Property Details", s, accent)
        prop_rows = [["Detail", "Value"]]
        if prop.get("address") and prop["address"] != "null":
            prop_rows.append(["Property Address", str(prop["address"])])
        if prop.get("type") and prop["type"] != "null":
            prop_rows.append(["Property Type", str(prop["type"])])
        offer_price = (
            prop.get("offer_price")
            if prop.get("offer_price") and prop["offer_price"] != "null"
            else user_profile.get("property_value")
        )
        if offer_price:
            prop_rows.append(["Offer Price", str(offer_price)])
        if prop.get("stamp_duty") and prop["stamp_duty"] != "null":
            prop_rows.append(["Estimated Stamp Duty", str(prop["stamp_duty"])])
        elif user and user.property_value:
            sd = calculate_stamp_duty(
                user.property_value,
                user.first_time_buyer if user else True,
            )
            prop_rows.append(["Estimated Stamp Duty", f"\u00a3{sd // 100:,}"])
        if user_profile.get("deposit_amount"):
            prop_rows.append(["Deposit", str(user_profile["deposit_amount"])])
        if len(prop_rows) > 1:
            elements.append(
                _styled_table(prop_rows, [55 * mm, 100 * mm], navy, light_bg)
            )
        section_counter = 2
    else:
        section_counter = 1

    # ================================================================
    # SECTION 3: Applicant Income Summary
    # ================================================================
    _section_heading(
        elements, f"{section_counter}. Applicant Income Summary", s, accent
    )
    section_counter += 1

    income_data = analysis.get("income_data", [])
    if income_data:
        for applicant_info in income_data:
            app_name = applicant_info.get("applicant", "Applicant")
            emp_type = applicant_info.get("employment_type", "")
            role = applicant_info.get("role", "")
            company = applicant_info.get("company", "")

            desc_parts = [f"<b>{_escape(str(app_name))}</b>"]
            if emp_type and emp_type != "null":
                desc_parts.append(
                    f"Employment: {_escape(str(emp_type).replace('_', ' ').title())}"
                )
            if role and role != "null":
                desc_parts.append(f"Role: {_escape(str(role))}")
            if company and company != "null":
                desc_parts.append(f"Company: {_escape(str(company))}")
            elements.append(Paragraph("  |  ".join(desc_parts), s["body"]))

            tax_years = applicant_info.get("tax_years", [])
            if tax_years:
                income_rows = [
                    ["Tax Year", "Salary", "Dividends", "Total Income", "Tax Due"]
                ]
                for ty in tax_years:
                    income_rows.append(
                        [
                            str(ty.get("year", "-")),
                            str(ty.get("salary", "-"))
                            if ty.get("salary") and ty["salary"] != "null"
                            else "-",
                            str(ty.get("dividends", "-"))
                            if ty.get("dividends") and ty["dividends"] != "null"
                            else "-",
                            str(ty.get("total_income", "-"))
                            if ty.get("total_income") and ty["total_income"] != "null"
                            else "-",
                            str(ty.get("tax_due", "-"))
                            if ty.get("tax_due") and ty["tax_due"] != "null"
                            else "-",
                        ]
                    )
                elements.append(
                    _styled_table(
                        income_rows,
                        [28 * mm, 30 * mm, 30 * mm, 33 * mm, 30 * mm],
                        navy,
                        light_bg,
                    )
                )
            elements.append(Spacer(1, 3 * mm))
    else:
        # Fallback: show profile income
        if user_profile.get("annual_income"):
            elements.append(
                Paragraph(
                    f"Stated annual income: <b>{_escape(str(user_profile['annual_income']))}</b>  |  "
                    f"Employment type: <b>{_escape(str(user_profile.get('employment_type', 'Not specified')).replace('_', ' ').title())}</b>",
                    s["body"],
                )
            )
        else:
            elements.append(
                Paragraph(
                    "No income data available. Upload SA302s, P60s or payslips for a detailed breakdown.",
                    s["body"],
                )
            )

    # ================================================================
    # SECTION 4: Credit Profile Summary
    # ================================================================
    credit = analysis.get("credit_summary", {})
    credit_points = credit.get("key_points", [])
    has_credit = (credit.get("score") and credit["score"] != "null") or credit_points

    if has_credit:
        _section_heading(
            elements, f"{section_counter}. Credit Profile Summary", s, accent
        )
        section_counter += 1
        if credit.get("score") and credit["score"] != "null":
            elements.append(
                Paragraph(
                    f"Credit Score: <b>{_escape(str(credit['score']))}</b>", s["body"]
                )
            )
        for point in credit_points:
            if point:
                elements.append(
                    Paragraph(f"\u2022  {_escape(str(point))}", s["bullet"])
                )

    # ================================================================
    # SECTION 5: Savings & Deposit Position
    # ================================================================
    savings_data = analysis.get("savings_data", [])
    has_savings = savings_data and any(
        s_item.get("balance") and s_item["balance"] != "null" for s_item in savings_data
    )

    if has_savings or user_profile.get("deposit_amount"):
        _section_heading(
            elements, f"{section_counter}. Savings &amp; Deposit Position", s, accent
        )
        section_counter += 1

        if has_savings:
            savings_rows = [["Account", "Balance", "Date"]]
            for s_item in savings_data:
                if s_item.get("balance") and s_item["balance"] != "null":
                    savings_rows.append(
                        [
                            str(s_item.get("account", "-")),
                            str(s_item.get("balance", "-")),
                            str(s_item.get("date", "-"))
                            if s_item.get("date") and s_item["date"] != "null"
                            else "-",
                        ]
                    )
            if len(savings_rows) > 1:
                elements.append(
                    _styled_table(
                        savings_rows,
                        [60 * mm, 50 * mm, 45 * mm],
                        navy,
                        light_bg,
                    )
                )
        elif user_profile.get("deposit_amount"):
            elements.append(
                Paragraph(
                    f"Stated deposit: <b>{_escape(str(user_profile['deposit_amount']))}</b>",
                    s["body"],
                )
            )

    # ================================================================
    # SECTION 6: Mortgage Borrowing Capacity
    # ================================================================
    _section_heading(
        elements, f"{section_counter}. Mortgage Borrowing Capacity", s, accent
    )
    section_counter += 1

    if annual_income_raw and annual_income_raw > 0:
        income_val = annual_income_raw
        cap_rows = [
            ["Assessment Method", "Joint Income", "4.0x", "4.5x", "5.0x"],
            [
                "Stated Income",
                f"\u00a3{income_val:,}",
                f"\u00a3{income_val * 4:,}",
                f"\u00a3{int(income_val * 4.5):,}",
                f"\u00a3{income_val * 5:,}",
            ],
        ]

        # Try to derive additional rows from income_data
        for applicant_info in income_data:
            tax_years = applicant_info.get("tax_years", [])
            if not tax_years:
                continue
            # Latest SA302
            latest = tax_years[0]
            total_str = latest.get("total_income")
            if total_str and total_str != "null":
                # Parse the income amount
                cleaned = re.sub(r"[^\d.]", "", str(total_str))
                try:
                    parsed_income = int(float(cleaned))
                    if parsed_income > 0:
                        cap_rows.append(
                            [
                                "Latest SA302",
                                f"\u00a3{parsed_income:,}",
                                f"\u00a3{parsed_income * 4:,}",
                                f"\u00a3{int(parsed_income * 4.5):,}",
                                f"\u00a3{parsed_income * 5:,}",
                            ]
                        )
                except (ValueError, TypeError):
                    pass
            # 2-year average
            if len(tax_years) >= 2:
                totals = []
                for ty in tax_years[:2]:
                    t = ty.get("total_income")
                    if t and t != "null":
                        cleaned = re.sub(r"[^\d.]", "", str(t))
                        try:
                            totals.append(float(cleaned))
                        except (ValueError, TypeError):
                            pass
                if len(totals) == 2:
                    avg = int(sum(totals) / 2)
                    cap_rows.append(
                        [
                            "2-Year Average",
                            f"\u00a3{avg:,}",
                            f"\u00a3{avg * 4:,}",
                            f"\u00a3{int(avg * 4.5):,}",
                            f"\u00a3{avg * 5:,}",
                        ]
                    )

        elements.append(
            _styled_table(
                cap_rows,
                [35 * mm, 30 * mm, 30 * mm, 30 * mm, 30 * mm],
                navy,
                light_bg,
            )
        )
        elements.append(Spacer(1, 2 * mm))
        elements.append(
            Paragraph(
                "Note: Most high-street lenders offer 4.0x-4.5x income. Select lenders "
                "(e.g. Habito, Kensington, Halifax) may consider up to 5.0x-5.5x for certain applicants.",
                s["disclaimer"],
            )
        )
    else:
        elements.append(
            Paragraph(
                "Borrowing capacity cannot be calculated without income data. "
                "Please complete your profile or upload income documents.",
                s["body"],
            )
        )

    # ================================================================
    # SECTION 7: Document Checklist
    # ================================================================
    _section_heading(elements, f"{section_counter}. Document Checklist", s, accent)
    section_counter += 1

    if readiness:
        checklist = readiness.get("checklist", [])
        pct = readiness.get("overall_percentage", 0)

        elements.append(
            Paragraph(
                f"Overall readiness: <b>{pct}%</b>  |  "
                f"Employment type: <b>{_escape(readiness.get('employment_type', 'employed').replace('_', ' ').title())}</b>",
                s["body"],
            )
        )

        doc_rows = [["Document Required", "Status"]]
        for item in checklist:
            status_icon = "\u2713" if item["status"] == "uploaded" else "\u2717"
            status_label = f"{status_icon} {item['status'].title()}"
            if item["documents"]:
                status_label += f" ({', '.join(item['documents'][:2])})"
            doc_rows.append([item["label"], status_label])

        elements.append(_styled_table(doc_rows, [90 * mm, 65 * mm], navy, light_bg))

        missing = readiness.get("missing_documents", [])
        if missing:
            elements.append(Spacer(1, 2 * mm))
            elements.append(
                Paragraph(
                    f"<b>Missing documents ({len(missing)}):</b> {_escape(', '.join(missing))}",
                    s["body"],
                )
            )
    else:
        elements.append(
            Paragraph(
                "Document checklist unavailable - user profile not found.", s["body"]
            )
        )

    # ================================================================
    # SECTION 8: Key Challenges & Considerations
    # ================================================================
    challenges = analysis.get("challenges", [])
    if challenges:
        _section_heading(
            elements,
            f"{section_counter}. Key Challenges &amp; Considerations",
            s,
            accent,
        )
        section_counter += 1
        for i, challenge in enumerate(challenges, 1):
            if challenge:
                elements.append(
                    Paragraph(
                        f"<b>{i}.</b>  {_escape(str(challenge))}",
                        s["list_item"],
                    )
                )

    # ================================================================
    # SECTION 9: Recommendations
    # ================================================================
    recs = analysis.get("recommendations", {})
    has_recs = (
        recs.get("immediate")
        or recs.get("strengthen")
        or recs.get("lender_suggestions")
    )

    if has_recs:
        _section_heading(elements, f"{section_counter}. Recommendations", s, accent)
        section_counter += 1

        immediate = recs.get("immediate", [])
        if immediate:
            elements.append(Paragraph("<b>Immediate Actions</b>", s["h3"]))
            for i, action in enumerate(immediate, 1):
                if action:
                    elements.append(
                        Paragraph(
                            f"<b>{i}.</b>  {_escape(str(action))}", s["list_item"]
                        )
                    )

        strengthen = recs.get("strengthen", [])
        if strengthen:
            elements.append(Paragraph("<b>To Strengthen Your Position</b>", s["h3"]))
            for i, action in enumerate(strengthen, 1):
                if action:
                    elements.append(
                        Paragraph(
                            f"<b>{i}.</b>  {_escape(str(action))}", s["list_item"]
                        )
                    )

        lenders = recs.get("lender_suggestions", [])
        if lenders:
            elements.append(Paragraph("<b>Suggested Lenders</b>", s["h3"]))
            for lender in lenders:
                if lender:
                    elements.append(
                        Paragraph(f"\u2022  {_escape(str(lender))}", s["bullet"])
                    )

    # ================================================================
    # SECTION 10: Summary & Overall Assessment
    # ================================================================
    _section_heading(
        elements, f"{section_counter}. Summary &amp; Overall Assessment", s, accent
    )
    section_counter += 1

    exec_summary = analysis.get("executive_summary", "")
    position = analysis.get("overall_position", "")

    if position:
        position_colors = {
            "STRONG": HexColor("#166534"),
            "MODERATE": HexColor("#92400e"),
            "NEEDS WORK": HexColor("#991b1b"),
        }
        pos_color = position_colors.get(position.upper(), dark_text)
        position_style = ParagraphStyle(
            "PositionBadge",
            parent=s["body"],
            fontSize=14,
            textColor=pos_color,
            fontName="Helvetica-Bold",
            spaceAfter=4 * mm,
            alignment=TA_CENTER,
        )
        elements.append(
            Paragraph(f"Overall Position: {_escape(position.upper())}", position_style)
        )

    if exec_summary:
        elements.append(Paragraph(_escape(str(exec_summary)), summary_box_style))
    else:
        elements.append(
            Paragraph(
                "This report summarises the AI-generated mortgage advice "
                "based on your uploaded financial documents and consultation sessions. "
                "The analysis above was tailored to your specific financial situation "
                "using current UK mortgage market data and lender criteria.",
                s["body"],
            )
        )

    # ================================================================
    # SECTION 11: Disclaimer
    # ================================================================
    elements.append(Spacer(1, 10 * mm))
    elements.append(
        HRFlowable(
            width="100%",
            thickness=0.5,
            color=HexColor("#e5e7eb"),
            spaceBefore=0,
            spaceAfter=3 * mm,
        )
    )
    elements.append(Paragraph(f"<b>{section_counter}. Disclaimer</b>", s["body"]))
    elements.append(
        Paragraph(
            "IMPORTANT: This report contains AI-generated analysis and should NOT be "
            "considered as professional mortgage advice regulated by the FCA. The strategies and "
            "recommendations contained herein are generated by an artificial intelligence "
            "system and have not been reviewed by a qualified mortgage broker. "
            "You should always consult with a qualified, FCA-regulated mortgage adviser before making any "
            "financial decisions. Mortgage rates and product availability change daily. "
            "We accept no liability for any actions taken based on "
            "the content of this report. Your home may be repossessed if you do not keep up "
            "repayments on your mortgage.",
            s["disclaimer"],
        )
    )

    elements.append(Spacer(1, 8 * mm))
    elements.append(
        HRFlowable(
            width="100%", thickness=1, color=accent, spaceBefore=0, spaceAfter=3 * mm
        )
    )
    elements.append(Paragraph("AI Mortgage Adviser", s["brand"]))
    elements.append(
        Paragraph(
            "mortgage-advisor.probooking.app  \u2022  Powered by GPT-4o  \u2022  "
            f"\u00a9 {datetime.utcnow().year}",
            s["brand_sub"],
        )
    )

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()
