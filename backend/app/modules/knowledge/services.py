import re
from typing import Optional

from sqlalchemy.orm import Session

from app.modules.knowledge.models import KnowledgeEntry, KnowledgeCategory
from app.modules.documents.models import Document


# Keywords that hint at category classification for mortgage context
CATEGORY_KEYWORDS = {
    KnowledgeCategory.INCOME: [
        "income",
        "salary",
        "wages",
        "earnings",
        "pay",
        "gross",
        "net",
        "annual",
        "monthly",
        "bonus",
        "overtime",
        "commission",
        "dividend",
        "rental income",
        "self-employed",
        "turnover",
        "profit",
        "p60",
        "p45",
        "payslip",
        "sa302",
    ],
    KnowledgeCategory.PROPERTY: [
        "property",
        "house",
        "flat",
        "apartment",
        "valuation",
        "purchase price",
        "market value",
        "freehold",
        "leasehold",
        "new build",
        "semi-detached",
        "terraced",
        "detached",
        "bungalow",
        "epc",
        "survey",
    ],
    KnowledgeCategory.DEPOSIT: [
        "deposit",
        "savings",
        "lisa",
        "lifetime isa",
        "help to buy",
        "gifted deposit",
        "proof of deposit",
        "source of funds",
        "bank balance",
    ],
    KnowledgeCategory.EMPLOYMENT: [
        "employment",
        "employer",
        "contract",
        "permanent",
        "temporary",
        "probation",
        "self-employed",
        "director",
        "cis",
        "contractor",
        "limited company",
        "sole trader",
        "partnership",
        "start date",
        "job title",
    ],
    KnowledgeCategory.CREDIT: [
        "credit",
        "debt",
        "loan",
        "credit card",
        "overdraft",
        "default",
        "ccj",
        "iva",
        "bankruptcy",
        "credit score",
        "credit report",
        "experian",
        "equifax",
        "transunion",
        "missed payment",
        "arrears",
    ],
    KnowledgeCategory.EXPENSES: [
        "expense",
        "outgoing",
        "payment",
        "rent",
        "utility",
        "insurance",
        "childcare",
        "car finance",
        "subscription",
        "council tax",
        "ground rent",
        "service charge",
        "maintenance",
        "committed expenditure",
    ],
    KnowledgeCategory.MORTGAGE_TERMS: [
        "mortgage",
        "interest rate",
        "fixed rate",
        "tracker",
        "svr",
        "ltv",
        "loan to value",
        "repayment",
        "interest only",
        "term",
        "early repayment",
        "overpayment",
        "remortgage",
        "product transfer",
        "porting",
        "lender",
    ],
}


def classify_text(text: str) -> KnowledgeCategory:
    text_lower = text.lower()
    scores: dict[KnowledgeCategory, int] = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[category] = score

    if scores:
        return max(scores, key=scores.get)
    return KnowledgeCategory.GENERAL


def build_knowledge_from_document(
    db: Session, document: Document
) -> list[KnowledgeEntry]:
    if not document.extracted_text:
        return []

    text = document.extracted_text
    entries = []

    # Split text into meaningful chunks (by paragraphs or sections)
    chunks = split_into_chunks(text)

    for i, chunk in enumerate(chunks):
        if len(chunk.strip()) < 20:
            continue

        category = classify_text(chunk)
        title = generate_title(chunk, document.filename, i + 1)

        entry = KnowledgeEntry(
            consultation_id=document.consultation_id,
            category=category,
            title=title,
            content=chunk.strip(),
            source_document_id=document.id,
        )
        db.add(entry)
        entries.append(entry)

    db.commit()
    for entry in entries:
        db.refresh(entry)
    return entries


def split_into_chunks(text: str, max_chunk_size: int = 2000) -> list[str]:
    # First try splitting by double newlines (paragraphs)
    paragraphs = re.split(r"\n\s*\n", text)

    chunks = []
    current_chunk = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if len(current_chunk) + len(para) + 2 > max_chunk_size and current_chunk:
            chunks.append(current_chunk)
            current_chunk = para
        else:
            current_chunk = f"{current_chunk}\n\n{para}" if current_chunk else para

    if current_chunk:
        chunks.append(current_chunk)

    # If we only got one giant chunk, try splitting by single newlines
    if len(chunks) == 1 and len(chunks[0]) > max_chunk_size:
        lines = chunks[0].split("\n")
        chunks = []
        current_chunk = ""
        for line in lines:
            if len(current_chunk) + len(line) + 1 > max_chunk_size and current_chunk:
                chunks.append(current_chunk)
                current_chunk = line
            else:
                current_chunk = f"{current_chunk}\n{line}" if current_chunk else line
        if current_chunk:
            chunks.append(current_chunk)

    return chunks if chunks else [text]


def generate_title(chunk: str, filename: str, index: int) -> str:
    # Use the first meaningful line as title
    lines = chunk.strip().split("\n")
    first_line = lines[0].strip()
    if len(first_line) > 10 and len(first_line) < 200:
        return first_line[:100]
    return f"{filename} - Section {index}"


def get_consultation_knowledge(
    db: Session,
    consultation_id: int,
    category: Optional[KnowledgeCategory] = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[KnowledgeEntry], int]:
    query = db.query(KnowledgeEntry).filter(
        KnowledgeEntry.consultation_id == consultation_id
    )
    if category:
        query = query.filter(KnowledgeEntry.category == category)
    total = query.count()
    entries = (
        query.order_by(KnowledgeEntry.created_at.desc()).offset(skip).limit(limit).all()
    )
    return entries, total


def get_knowledge_base_text(db: Session, consultation_id: int) -> str:
    entries = (
        db.query(KnowledgeEntry)
        .filter(KnowledgeEntry.consultation_id == consultation_id)
        .order_by(KnowledgeEntry.category, KnowledgeEntry.created_at)
        .all()
    )
    if not entries:
        return "No documents have been uploaded yet. Ask the user to upload their financial documents for mortgage assessment."

    sections: dict[str, list[str]] = {}
    for entry in entries:
        cat = entry.category.value.upper()
        if cat not in sections:
            sections[cat] = []
        sections[cat].append(f"- {entry.title}: {entry.content[:500]}")

    parts = []
    for cat, items in sections.items():
        parts.append(f"\n## {cat}\n" + "\n".join(items))

    return "\n".join(parts)


def build_knowledge_graph(db: Session, consultation_id: int) -> dict:
    entries = (
        db.query(KnowledgeEntry)
        .filter(KnowledgeEntry.consultation_id == consultation_id)
        .all()
    )

    nodes = []
    edges = []

    # Add a central node for the consultation
    nodes.append(
        {
            "id": "consultation",
            "label": "Mortgage Overview",
            "category": "center",
            "size": 3,
        }
    )

    # Add category nodes
    categories_present = set()
    for entry in entries:
        categories_present.add(entry.category.value)

    for cat in categories_present:
        cat_id = f"cat_{cat}"
        nodes.append(
            {
                "id": cat_id,
                "label": cat.replace("_", " ").title(),
                "category": cat,
                "size": 2,
            }
        )
        edges.append({"source": "consultation", "target": cat_id, "label": "includes"})

    # Add entry nodes
    for entry in entries:
        entry_id = f"entry_{entry.id}"
        nodes.append(
            {
                "id": entry_id,
                "label": entry.title[:50],
                "category": entry.category.value,
                "size": 1,
            }
        )
        edges.append(
            {
                "source": f"cat_{entry.category.value}",
                "target": entry_id,
                "label": "contains",
            }
        )

        # Link entries from same document
        if entry.source_document_id:
            doc_id = f"doc_{entry.source_document_id}"
            if not any(n["id"] == doc_id for n in nodes):
                nodes.append(
                    {
                        "id": doc_id,
                        "label": f"Document #{entry.source_document_id}",
                        "category": "document",
                        "size": 1,
                    }
                )
            edges.append(
                {"source": doc_id, "target": entry_id, "label": "extracted from"}
            )

    return {"nodes": nodes, "edges": edges}
