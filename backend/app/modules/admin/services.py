from sqlalchemy.orm import Session

from app.modules.users.models import User
from app.modules.payments.models import (
    Payment,
    PaymentStatus,
    Consultation,
    ConsultationStatus,
)
from app.modules.documents.models import Document
from app.modules.chat.models import Message
from app.modules.knowledge.models import KnowledgeEntry


def get_dashboard_stats(db: Session) -> dict:
    total_users = db.query(User).count()
    total_consultations = db.query(Consultation).count()
    active_consultations = (
        db.query(Consultation)
        .filter(Consultation.status == ConsultationStatus.ACTIVE)
        .count()
    )
    total_payments = (
        db.query(Payment).filter(Payment.status == PaymentStatus.COMPLETED).count()
    )
    total_revenue = (
        db.query(Payment)
        .filter(Payment.status == PaymentStatus.COMPLETED)
        .with_entities(Payment.amount)
        .all()
    )
    revenue_sum = sum(p.amount for p in total_revenue) if total_revenue else 0
    total_documents = db.query(Document).count()
    total_messages = db.query(Message).count()
    total_knowledge_entries = db.query(KnowledgeEntry).count()

    return {
        "total_users": total_users,
        "total_consultations": total_consultations,
        "active_consultations": active_consultations,
        "total_payments": total_payments,
        "total_revenue": revenue_sum,
        "total_documents": total_documents,
        "total_messages": total_messages,
        "total_knowledge_entries": total_knowledge_entries,
    }


def get_all_users(
    db: Session, skip: int = 0, limit: int = 50
) -> tuple[list[User], int]:
    total = db.query(User).count()
    users = (
        db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    )
    return users, total


def get_all_consultations(
    db: Session, skip: int = 0, limit: int = 50
) -> tuple[list[Consultation], int]:
    total = db.query(Consultation).count()
    consultations = (
        db.query(Consultation)
        .order_by(Consultation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return consultations, total


def get_all_payments(
    db: Session, skip: int = 0, limit: int = 50
) -> tuple[list[Payment], int]:
    total = db.query(Payment).count()
    payments = (
        db.query(Payment)
        .order_by(Payment.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return payments, total


def get_all_messages(
    db: Session, consultation_id: int | None = None, skip: int = 0, limit: int = 100
) -> tuple[list[Message], int]:
    query = db.query(Message)
    if consultation_id:
        query = query.filter(Message.consultation_id == consultation_id)
    total = query.count()
    messages = query.order_by(Message.created_at.desc()).offset(skip).limit(limit).all()
    return messages, total


def get_all_knowledge_entries(
    db: Session, consultation_id: int | None = None, skip: int = 0, limit: int = 100
) -> tuple[list[KnowledgeEntry], int]:
    query = db.query(KnowledgeEntry)
    if consultation_id:
        query = query.filter(KnowledgeEntry.consultation_id == consultation_id)
    total = query.count()
    entries = (
        query.order_by(KnowledgeEntry.created_at.desc()).offset(skip).limit(limit).all()
    )
    return entries, total
