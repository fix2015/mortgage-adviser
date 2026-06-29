from typing import Optional

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.modules.users.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email.lower()).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create_user(
    db: Session,
    email: str,
    password: str,
    full_name: Optional[str] = None,
) -> User:
    user = User(
        email=email.lower().strip(),
        hashed_password=hash_password(password),
        full_name=full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, **kwargs) -> User:
    for key, value in kwargs.items():
        if value is not None and hasattr(user, key):
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session, skip: int = 0, limit: int = 50) -> tuple[list[User], int]:
    total = db.query(User).count()
    users = db.query(User).offset(skip).limit(limit).all()
    return users, total


def export_user_data(db: Session, user_id: int) -> dict:
    """Collect ALL user data for GDPR export."""
    from app.modules.payments.models import Payment, Consultation
    from app.modules.documents.models import Document
    from app.modules.chat.models import Message, MortgageComparison
    from app.modules.knowledge.models import KnowledgeEntry

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {}

    # User profile
    profile = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value if user.role else None,
        "is_active": user.is_active,
        "employment_type": user.employment_type,
        "annual_income": user.annual_income,
        "property_value": user.property_value,
        "deposit_amount": user.deposit_amount,
        "first_time_buyer": user.first_time_buyer,
        "onboarding_completed": user.onboarding_completed,
        "created_at": str(user.created_at) if user.created_at else None,
    }

    # Consultations
    consultations = db.query(Consultation).filter(Consultation.user_id == user_id).all()
    consultations_data = [
        {
            "id": c.id,
            "status": c.status.value if c.status else None,
            "questions_used": c.questions_used,
            "questions_limit": c.questions_limit,
            "is_trial": c.is_trial,
            "created_at": str(c.created_at) if c.created_at else None,
        }
        for c in consultations
    ]

    # Payments
    payments = db.query(Payment).filter(Payment.user_id == user_id).all()
    payments_data = [
        {
            "id": p.id,
            "amount": p.amount,
            "currency": p.currency,
            "status": p.status.value if p.status else None,
            "payment_type": p.payment_type.value if p.payment_type else None,
            "created_at": str(p.created_at) if p.created_at else None,
        }
        for p in payments
    ]

    # Documents (metadata only, not file content)
    documents = db.query(Document).filter(Document.user_id == user_id).all()
    documents_data = [
        {
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "status": d.status.value if d.status else None,
            "document_type": d.document_type,
            "checklist_category": d.checklist_category,
            "created_at": str(d.created_at) if d.created_at else None,
        }
        for d in documents
    ]

    # Messages
    messages = db.query(Message).filter(Message.user_id == user_id).all()
    messages_data = [
        {
            "id": m.id,
            "consultation_id": m.consultation_id,
            "role": m.role.value if m.role else None,
            "content": m.content,
            "created_at": str(m.created_at) if m.created_at else None,
        }
        for m in messages
    ]

    # Knowledge entries
    consultation_ids = [c.id for c in consultations]
    knowledge_entries = (
        db.query(KnowledgeEntry)
        .filter(KnowledgeEntry.consultation_id.in_(consultation_ids))
        .all()
        if consultation_ids
        else []
    )
    knowledge_data = [
        {
            "id": k.id,
            "category": k.category.value if k.category else None,
            "title": k.title,
            "content": k.content,
            "created_at": str(k.created_at) if k.created_at else None,
        }
        for k in knowledge_entries
    ]

    # Mortgage comparisons
    comparisons = (
        db.query(MortgageComparison).filter(MortgageComparison.user_id == user_id).all()
    )
    comparisons_data = [
        {
            "id": mc.id,
            "lender_name": mc.lender_name,
            "product_type": mc.product_type,
            "interest_rate": mc.interest_rate,
            "monthly_payment": mc.monthly_payment,
            "term_years": mc.term_years,
            "ltv": mc.ltv,
            "total_cost": mc.total_cost,
            "fees": mc.fees,
            "created_at": str(mc.created_at) if mc.created_at else None,
        }
        for mc in comparisons
    ]

    return {
        "profile": profile,
        "consultations": consultations_data,
        "payments": payments_data,
        "documents": documents_data,
        "messages": messages_data,
        "knowledge_entries": knowledge_data,
        "mortgage_comparisons": comparisons_data,
        "exported_at": str(__import__("datetime").datetime.utcnow()),
    }


def delete_user_account(db: Session, user_id: int) -> None:
    """Cascading delete of all user data for GDPR compliance."""
    import boto3
    from app.config import settings
    from app.modules.payments.models import Payment, Consultation
    from app.modules.documents.models import Document
    from app.modules.chat.models import Message, MortgageComparison
    from app.modules.knowledge.models import KnowledgeEntry
    from app.modules.auth.models import RefreshToken

    # Get user consultations for knowledge entry cleanup
    consultations = db.query(Consultation).filter(Consultation.user_id == user_id).all()
    consultation_ids = [c.id for c in consultations]

    # Delete knowledge entries
    if consultation_ids:
        db.query(KnowledgeEntry).filter(
            KnowledgeEntry.consultation_id.in_(consultation_ids)
        ).delete(synchronize_session=False)

    # Delete mortgage comparisons
    db.query(MortgageComparison).filter(MortgageComparison.user_id == user_id).delete(
        synchronize_session=False
    )

    # Delete messages
    db.query(Message).filter(Message.user_id == user_id).delete(
        synchronize_session=False
    )

    # Delete documents (+ S3 files)
    documents = db.query(Document).filter(Document.user_id == user_id).all()
    if documents:
        try:
            s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION,
            )
            for doc in documents:
                try:
                    s3.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=doc.s3_key)
                except Exception:
                    pass
        except Exception:
            pass
        db.query(Document).filter(Document.user_id == user_id).delete(
            synchronize_session=False
        )

    # Delete consultations
    db.query(Consultation).filter(Consultation.user_id == user_id).delete(
        synchronize_session=False
    )

    # Delete payments
    db.query(Payment).filter(Payment.user_id == user_id).delete(
        synchronize_session=False
    )

    # Delete refresh tokens
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete(
        synchronize_session=False
    )

    # Delete user
    db.query(User).filter(User.id == user_id).delete(synchronize_session=False)

    db.commit()
