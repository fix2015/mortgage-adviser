import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum

from app.database import Base


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Mortgage-specific onboarding fields
    employment_type = Column(
        String(50), nullable=True
    )  # employed, self_employed, cis_contractor, company_director
    annual_income = Column(Integer, nullable=True)
    property_value = Column(Integer, nullable=True)
    deposit_amount = Column(Integer, nullable=True)
    first_time_buyer = Column(Boolean, default=True, nullable=False)
    onboarding_completed = Column(Boolean, default=False, nullable=False)

    # Partner invite fields
    partner_user_id = Column(Integer, nullable=True)
    invite_token = Column(String(255), nullable=True)
    invited_partner_email = Column(String(255), nullable=True)
    invited_partner_name = Column(String(255), nullable=True)

    # Password reset fields
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
