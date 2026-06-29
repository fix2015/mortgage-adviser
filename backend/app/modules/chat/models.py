import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Enum,
    Text,
    Float,
)

from app.database import Base


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(
        Integer,
        ForeignKey("consultations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role = Column(Enum(MessageRole), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Strategy(Base):
    __tablename__ = "strategies"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(
        Integer, ForeignKey("consultations.id"), nullable=False, index=True
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title = Column(String(500), nullable=False)
    s3_key = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class MortgageComparison(Base):
    __tablename__ = "mortgage_comparisons"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(
        Integer,
        ForeignKey("consultations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    lender_name = Column(String(255), nullable=False)
    product_type = Column(String(100), nullable=False)
    interest_rate = Column(Float, nullable=False)
    monthly_payment = Column(Integer, nullable=False)  # in pence
    term_years = Column(Integer, nullable=False)
    ltv = Column(Float, nullable=False)
    total_cost = Column(Integer, nullable=False)  # in pence
    fees = Column(Integer, nullable=False, default=0)  # in pence
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
