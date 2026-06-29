import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text

from app.database import Base


class KnowledgeCategory(str, enum.Enum):
    INCOME = "income"
    PROPERTY = "property"
    DEPOSIT = "deposit"
    EMPLOYMENT = "employment"
    CREDIT = "credit"
    EXPENSES = "expenses"
    MORTGAGE_TERMS = "mortgage_terms"
    GENERAL = "general"


class KnowledgeEntry(Base):
    __tablename__ = "knowledge_entries"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(
        Integer,
        ForeignKey("consultations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category = Column(
        Enum(KnowledgeCategory), default=KnowledgeCategory.GENERAL, nullable=False
    )
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    source_document_id = Column(
        Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
