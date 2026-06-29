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
    BigInteger,
)

from app.database import Base


class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    ERROR = "error"


class Document(Base):
    __tablename__ = "documents"

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
    filename = Column(String(500), nullable=False)
    s3_key = Column(String(1000), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    status = Column(
        Enum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False
    )
    extracted_text = Column(Text, nullable=True)
    document_type = Column(
        String(50), nullable=True
    )  # "passport", "payslip", "bank_statement", "tax_return", "contract", "utility_bill", "other"
    checklist_category = Column(
        String(50), nullable=True
    )  # "id", "address", "immigration", "income", "bank_statements", "deposit",
    #  "credit_report", "employment", "company_accounts", "payslips", "tax_returns", "other"
    structured_data = Column(
        Text, nullable=True
    )  # JSON string of extracted key figures
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
