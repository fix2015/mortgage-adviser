from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.modules.payments.models import PaymentStatus, PaymentType, ConsultationStatus


class CreateCheckoutRequest(BaseModel):
    payment_type: PaymentType
    consultation_id: Optional[int] = None  # required for extra_questions
    success_url: str = "http://localhost:5173/payment/success"
    cancel_url: str = "http://localhost:5173/payment/cancel"


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


class PaymentResponse(BaseModel):
    id: int
    user_id: int
    stripe_session_id: Optional[str] = None
    amount: int
    currency: str
    status: PaymentStatus
    payment_type: PaymentType
    created_at: datetime

    model_config = {"from_attributes": True}


class ConsultationResponse(BaseModel):
    id: int
    user_id: int
    payment_id: Optional[int] = None
    status: ConsultationStatus
    questions_used: int
    questions_limit: int
    is_trial: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentListResponse(BaseModel):
    payments: list[PaymentResponse]
    total: int


class ConsultationListResponse(BaseModel):
    consultations: list[ConsultationResponse]
    total: int


class SubscribeRequest(BaseModel):
    success_url: str = "http://localhost:5173/dashboard?payment=success"
    cancel_url: str = "http://localhost:5173/dashboard?payment=cancelled"
