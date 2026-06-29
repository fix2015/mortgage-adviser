import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Boolean

from app.database import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentType(str, enum.Enum):
    CONSULTATION = "consultation"
    EXTRA_QUESTIONS = "extra_questions"
    SUBSCRIPTION = "subscription"
    BROKER_REVIEW = "broker_review"


class ConsultationStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    stripe_session_id = Column(String(255), unique=True, nullable=True)
    stripe_payment_intent_id = Column(String(255), nullable=True)
    amount = Column(Integer, nullable=False)  # in pence
    currency = Column(String(3), default="gbp", nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    payment_type = Column(Enum(PaymentType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    status = Column(
        Enum(ConsultationStatus), default=ConsultationStatus.ACTIVE, nullable=False
    )
    questions_used = Column(Integer, default=0, nullable=False)
    questions_limit = Column(Integer, default=50, nullable=False)
    is_trial = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
