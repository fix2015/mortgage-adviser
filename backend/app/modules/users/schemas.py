from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.modules.users.models import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class MortgageInfoUpdate(BaseModel):
    employment_type: Optional[str] = (
        None  # employed, self_employed, cis_contractor, company_director
    )
    annual_income: Optional[int] = None
    property_value: Optional[int] = None
    deposit_amount: Optional[int] = None
    first_time_buyer: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime
    employment_type: Optional[str] = None
    annual_income: Optional[int] = None
    property_value: Optional[int] = None
    deposit_amount: Optional[int] = None
    first_time_buyer: bool = True
    onboarding_completed: bool = False

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
