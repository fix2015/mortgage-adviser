import json
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse, Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user, get_active_consultation
from app.modules.users.models import User
from app.modules.payments.models import Consultation, ConsultationStatus
from app.modules.payments.services import increment_question_count
from app.modules.chat.models import Message, MessageRole, Strategy, MortgageComparison
from app.modules.chat.schemas import (
    ChatRequest,
    ChatResponse,
    MessageListResponse,
    StrategyReportRequest,
    MortgageCalcRequest,
    MortgageCalcResponse,
    ReadinessResponse,
    CompareBanksRequest,
    CompareBanksResponse,
    LenderRecommendation,
    StrategyResponse,
    StrategyListResponse,
    NewsResponse,
    NewsArticle,
    FinancialSummaryResponse,
    LenderPredictionsResponse,
    HealthCheckRequest,
    HealthCheckResponse,
    EmployerReferenceResponse,
)
from app.modules.chat import services
from app.modules.documents.services import upload_to_s3, get_s3_client
from app.modules.notifications.email_service import send_consultation_summary

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/send", response_model=ChatResponse)
@limiter.limit("20/minute")
def send_message(
    request: Request,
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    # Check question limit
    if consultation.questions_used >= consultation.questions_limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Question limit reached. Please purchase additional questions.",
        )

    assistant_message = services.chat_completion(
        db=db,
        consultation_id=consultation.id,
        user_id=current_user.id,
        user_message=data.message,
        agent=data.agent,
    )

    # Increment question count
    increment_question_count(db, consultation)

    return ChatResponse(
        message=assistant_message,
        questions_used=consultation.questions_used,
        questions_limit=consultation.questions_limit,
    )


@router.post("/send/stream")
@limiter.limit("20/minute")
def send_message_stream(
    request: Request,
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    # Check question limit
    if consultation.questions_used >= consultation.questions_limit:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Question limit reached. Please purchase additional questions.",
        )

    def event_generator():
        for chunk in services.chat_completion_stream(
            db=db,
            consultation_id=consultation.id,
            user_id=current_user.id,
            user_message=data.message,
            agent=data.agent,
        ):
            yield f"data: {json.dumps({'content': chunk})}\n\n"

        # Increment question count after streaming completes
        increment_question_count(db, consultation)

        yield f"data: {json.dumps({'done': True, 'questions_used': consultation.questions_used, 'questions_limit': consultation.questions_limit})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.get("/history", response_model=MessageListResponse)
def get_chat_history(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    messages, total = services.get_consultation_messages(
        db, consultation.id, skip, limit
    )
    return MessageListResponse(messages=messages, total=total)


@router.get("/suggestions")
def get_suggestions(
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Return contextual quick question suggestions based on conversation state."""
    messages, total = services.get_consultation_messages(db, consultation.id, 0, 100)

    # If no messages yet, return starter questions
    if total == 0:
        return {
            "suggestions": [
                "Based on my documents, how much can I borrow and what's my maximum offer?",
                "Compare 2-year fixed vs 5-year fixed for my specific situation",
                "What happens when my fixed rate ends and what should I plan for?",
                "Is it worth paying a higher product fee for a lower rate? Show me the numbers",
                "Summarise my best mortgage options in a comparison table",
                "What could go wrong with my mortgage application based on my profile?",
            ]
        }

    # After conversation started, return follow-up questions
    last_messages = [
        m.content for m in messages[-3:] if m.role == MessageRole.ASSISTANT
    ]
    context = " ".join(last_messages)[:500]

    suggestions = []

    if any(w in context.lower() for w in ["rate", "fixed", "tracker", "svr"]):
        suggestions.extend(
            [
                "Compare 2-year fixed vs 5-year fixed for my situation",
                "What happens when my fixed rate ends?",
                "Is it worth paying a higher product fee for a lower rate?",
            ]
        )
    if any(w in context.lower() for w in ["deposit", "ltv", "loan to value"]):
        suggestions.extend(
            [
                "How much better would my rate be with a larger deposit?",
                "Can I use a Lifetime ISA bonus towards my deposit?",
            ]
        )
    if any(w in context.lower() for w in ["afford", "income", "salary", "borrow"]):
        suggestions.extend(
            [
                "Can I use overtime/bonus income to boost my borrowing?",
                "What if I have an existing car finance or credit card debt?",
            ]
        )
    if any(w in context.lower() for w in ["stamp duty", "sdlt", "tax"]):
        suggestions.extend(
            [
                "Do I qualify for first-time buyer stamp duty relief?",
                "How does stamp duty work on a shared ownership property?",
            ]
        )
    if any(w in context.lower() for w in ["buy to let", "btl", "rental", "landlord"]):
        suggestions.extend(
            [
                "Should I buy in my personal name or through a limited company?",
                "What rental yield do I need to qualify for a BTL mortgage?",
            ]
        )

    # Always add some universal follow-ups
    suggestions.extend(
        [
            "Summarise my best mortgage options in a comparison table",
            "What are the next steps I should take right now?",
            "What could go wrong with my mortgage application?",
        ]
    )

    # Deduplicate and limit
    seen = set()
    unique = []
    for s_item in suggestions:
        if s_item not in seen:
            seen.add(s_item)
            unique.append(s_item)
    return {"suggestions": unique[:6]}


@router.post("/mortgage-calc", response_model=MortgageCalcResponse)
def mortgage_calculator(
    data: MortgageCalcRequest,
    current_user: User = Depends(get_current_user),
):
    """Calculate mortgage repayment details. No OpenAI needed -- pure calculation."""
    if data.property_value <= 0:
        raise HTTPException(status_code=400, detail="Property value must be positive")
    if data.deposit < 0 or data.deposit >= data.property_value:
        raise HTTPException(
            status_code=400,
            detail="Deposit must be positive and less than property value",
        )
    if data.term_years < 1 or data.term_years > 40:
        raise HTTPException(
            status_code=400, detail="Term must be between 1 and 40 years"
        )
    if data.interest_rate < 0 or data.interest_rate > 20:
        raise HTTPException(
            status_code=400, detail="Interest rate must be between 0% and 20%"
        )

    # Determine first-time buyer status from user profile
    first_time_buyer = getattr(current_user, "first_time_buyer", True)

    result = services.calculate_mortgage(
        property_value=data.property_value,
        deposit=data.deposit,
        term_years=data.term_years,
        interest_rate=data.interest_rate,
        first_time_buyer=first_time_buyer,
    )
    return MortgageCalcResponse(**result)


@router.get("/readiness", response_model=ReadinessResponse)
def get_readiness(
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Check document readiness for mortgage application. No OpenAI needed -- pure logic."""
    result = services.calculate_readiness(db, current_user.id, consultation.id)
    return ReadinessResponse(**result)


@router.get("/financial-summary", response_model=FinancialSummaryResponse)
def get_financial_summary(
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Extract key financial figures from uploaded documents using AI."""
    result = services.get_financial_summary(db, consultation.id, current_user.id)
    return result


@router.post("/compare-banks", response_model=CompareBanksResponse)
@limiter.limit("10/minute")
def compare_banks(
    request: Request,
    data: CompareBanksRequest,
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Use OpenAI to analyze user's financial situation and suggest best lenders."""
    recommendations = services.compare_banks(
        db=db,
        consultation_id=consultation.id,
        user_id=current_user.id,
        property_value=data.property_value,
        deposit=data.deposit,
        annual_income=data.annual_income,
        employment_type=data.employment_type,
        term_years=data.term_years,
        first_time_buyer=data.first_time_buyer,
    )

    # Save comparisons to database
    for rec in recommendations:
        comparison = MortgageComparison(
            consultation_id=consultation.id,
            user_id=current_user.id,
            lender_name=rec["lender_name"],
            product_type=rec["product_type"],
            interest_rate=rec["interest_rate"],
            monthly_payment=rec["monthly_payment"],
            term_years=rec["term_years"],
            ltv=rec["ltv"],
            total_cost=rec["total_cost"],
            fees=rec["fees"],
        )
        db.add(comparison)
    db.commit()

    return CompareBanksResponse(
        recommendations=[LenderRecommendation(**r) for r in recommendations]
    )


@router.get("/briefing")
def get_broker_briefing(
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Generate a briefing document for a real mortgage broker to review."""
    briefing = services.generate_broker_briefing(db, consultation.id)
    return {"briefing": briefing}


@router.get("/news", response_model=NewsResponse)
def get_news():
    """Return curated UK mortgage market news."""
    articles = [
        NewsArticle(
            title="Bank of England base rate holds at 4.5%",
            date="2025-05-08",
            summary="The Bank of England's Monetary Policy Committee voted to hold the base rate at 4.5%. Markets are pricing in gradual cuts through 2025/26, which should bring mortgage rates down over the coming months.",
            impact="high",
            category="Interest Rates",
        ),
        NewsArticle(
            title="First-time buyer stamp duty threshold: £425,000",
            date="2025-04-01",
            summary="First-time buyers pay 0% stamp duty on the first £425,000 of a property priced up to £625,000. Above £625,000, standard rates apply. This relief saves up to £6,250 compared to standard rates.",
            impact="high",
            category="Stamp Duty",
        ),
        NewsArticle(
            title="95% LTV mortgages widely available again",
            date="2025-06-01",
            summary="Multiple high-street lenders now offer 95% LTV mortgages for first-time buyers and home movers. Rates range from 5.0% to 5.8% for 2-year fixed deals, making 5% deposits viable again.",
            impact="high",
            category="Products",
        ),
        NewsArticle(
            title="Lifetime ISA: £4,000 annual limit with 25% government bonus",
            date="2025-04-06",
            summary="The Lifetime ISA remains available for 18-39 year olds saving for their first home. Save up to £4,000/year and receive a 25% government bonus (up to £1,000/year). Property must be £450,000 or less.",
            impact="medium",
            category="Government Schemes",
        ),
        NewsArticle(
            title="Mortgage guarantee scheme extended",
            date="2025-04-01",
            summary="The government's mortgage guarantee scheme, allowing lenders to offer 95% LTV mortgages with government backing, has been extended. This helps buyers with smaller deposits access competitive rates.",
            impact="medium",
            category="Government Schemes",
        ),
        NewsArticle(
            title="EPC rating C target for buy-to-let landlords",
            date="2025-03-01",
            summary="Landlords should prepare for proposed minimum EPC rating of C for new tenancies. Properties with lower ratings may need energy efficiency improvements before being let, affecting BTL mortgage applications.",
            impact="medium",
            category="Buy-to-Let",
        ),
        NewsArticle(
            title="Shared Ownership reforms: staircasing costs reduced",
            date="2025-04-01",
            summary="The government has introduced reforms to reduce staircasing costs in shared ownership, making it cheaper for part-owners to buy additional shares in their property over time.",
            impact="medium",
            category="Government Schemes",
        ),
        NewsArticle(
            title="Average UK house price: £290,000",
            date="2025-06-01",
            summary="Average UK house prices have risen 2.3% year-on-year according to the latest data. Regional variations remain significant, with London averaging £520,000 and the North East at £170,000.",
            impact="medium",
            category="Market Data",
        ),
    ]
    return NewsResponse(articles=articles)


@router.get("/lender-predictions", response_model=LenderPredictionsResponse)
@limiter.limit("5/minute")
def get_lender_predictions(
    request: Request,
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Predict approval likelihood per lender based on user's documents."""
    result = services.predict_lender_decisions(
        db=db,
        consultation_id=consultation.id,
        user_id=current_user.id,
    )
    return LenderPredictionsResponse(**result)


@router.post("/health-check", response_model=HealthCheckResponse)
def run_health_check(
    data: HealthCheckRequest,
    current_user: User = Depends(get_current_user),
):
    """Compare current mortgage against best available rates. No active consultation needed."""
    if data.current_rate <= 0 or data.current_rate > 20:
        raise HTTPException(
            status_code=400, detail="Current rate must be between 0% and 20%"
        )
    if data.current_balance <= 0:
        raise HTTPException(status_code=400, detail="Current balance must be positive")
    if data.remaining_term < 1 or data.remaining_term > 40:
        raise HTTPException(
            status_code=400, detail="Remaining term must be between 1 and 40 years"
        )

    result = services.mortgage_health_check(
        current_rate=data.current_rate,
        current_balance=data.current_balance,
        remaining_term=data.remaining_term,
        current_lender=data.current_lender,
    )
    return HealthCheckResponse(**result)


@router.get("/employer-reference", response_model=EmployerReferenceResponse)
@limiter.limit("5/minute")
def get_employer_reference(
    request: Request,
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Generate a draft employer reference letter based on uploaded documents."""
    letter_text = services.generate_employer_reference(
        db=db,
        consultation_id=consultation.id,
        user_id=current_user.id,
    )
    return EmployerReferenceResponse(letter_text=letter_text)


@router.post("/finish")
def finish_consultation(
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Mark consultation as completed and send email summary."""
    assistant_messages = (
        db.query(Message)
        .filter(
            Message.consultation_id == consultation.id,
            Message.role == MessageRole.ASSISTANT,
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    # Extract top strategy lines from AI messages
    strategies = []
    for msg in assistant_messages:
        for line in msg.content.split("\n"):
            stripped = line.strip()
            if stripped and any(
                stripped.startswith(p)
                for p in [
                    "Option",
                    "1.",
                    "2.",
                    "3.",
                    "4.",
                    "5.",
                    "- **",
                    "**Recommendation",
                    "I recommend",
                    "Based on your situation",
                ]
            ):
                clean = stripped.replace("**", "").replace("- ", "").strip()
                if len(clean) > 20 and clean not in strategies:
                    strategies.append(clean)
            if len(strategies) >= 5:
                break
        if len(strategies) >= 5:
            break

    if not strategies:
        strategies = [
            "Get a Mortgage in Principle from your recommended lender",
            "Ensure all required documents are gathered and up to date",
            "Check your credit report and address any issues",
            "Compare mortgage products before committing",
            "Consider using a qualified mortgage broker for the full application",
        ]

    consultation.status = ConsultationStatus.COMPLETED
    db.commit()

    user_name = current_user.full_name or current_user.email.split("@")[0]
    send_consultation_summary(
        to_email=current_user.email,
        user_name=user_name,
        strategies=strategies,
    )

    return {"message": "Consultation finished. Summary sent to your email."}


@router.post("/report", response_model=StrategyResponse)
def generate_report(
    data: StrategyReportRequest,
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    # Disable PDF report for trial users
    if getattr(consultation, "is_trial", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="PDF strategy reports are not available on the free trial. Upgrade to full consultation for £15.",
        )

    pdf_bytes = services.generate_strategy_report_pdf(db, consultation.id, data.title)

    # Upload to S3
    file_id = uuid.uuid4().hex
    s3_key = f"{settings.AWS_S3_PREFIX}/strategies/{current_user.id}/{consultation.id}/{file_id}.pdf"
    upload_to_s3(pdf_bytes, s3_key, "application/pdf")

    # Generate a short AI summary for the strategy record
    summary = _generate_strategy_summary(db, consultation.id)

    strategy = Strategy(
        consultation_id=consultation.id,
        user_id=current_user.id,
        title=data.title,
        s3_key=s3_key,
        file_size=len(pdf_bytes),
        summary=summary,
    )
    db.add(strategy)
    db.commit()
    db.refresh(strategy)

    return strategy


def _generate_strategy_summary(db: Session, consultation_id: int) -> str | None:
    """Generate a short AI summary of the consultation for the strategy record."""
    cache_key = f"strategy_summary:{consultation_id}"
    cached = services.get_cached(cache_key)
    if cached:
        return cached

    try:
        messages = (
            db.query(Message)
            .filter(
                Message.consultation_id == consultation_id,
                Message.role == MessageRole.ASSISTANT,
            )
            .order_by(Message.created_at.asc())
            .limit(5)
            .all()
        )
        if not messages:
            return None

        all_advice = "\n".join(m.content[:1500] for m in messages)
        client = services.get_openai_client()
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Write a 2-3 sentence summary of these mortgage consultation findings. "
                        "Include key recommendations, lender names, and any specific amounts. "
                        "Write in plain text, no markdown."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Summarise:\n\n{all_advice}",
                },
            ],
            max_tokens=200,
            temperature=0.3,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
        services.set_cached(cache_key, raw)
        return raw
    except Exception:
        return None


@router.get("/strategies", response_model=StrategyListResponse)
def list_strategies(
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Return all saved strategies for the active consultation."""
    query = db.query(Strategy).filter(
        Strategy.consultation_id == consultation.id,
        Strategy.user_id == current_user.id,
    )
    total = query.count()
    strategies = query.order_by(Strategy.created_at.desc()).all()
    return StrategyListResponse(strategies=strategies, total=total)


@router.get("/strategies/{strategy_id}/download")
def download_strategy(
    strategy_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download a previously generated strategy PDF from S3."""
    strategy = (
        db.query(Strategy)
        .filter(Strategy.id == strategy_id, Strategy.user_id == current_user.id)
        .first()
    )
    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Strategy not found.",
        )

    try:
        s3 = get_s3_client()
        s3_response = s3.get_object(Bucket=settings.AWS_S3_BUCKET, Key=strategy.s3_key)
        pdf_bytes = s3_response["Body"].read()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve the strategy PDF from storage.",
        )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="mortgage_report_{strategy.id}.pdf"'
        },
    )
