from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
import stripe

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.payments.models import PaymentType
from app.modules.payments.schemas import (
    CreateCheckoutRequest,
    CheckoutResponse,
    ConsultationResponse,
    PaymentListResponse,
    ConsultationListResponse,
    SubscribeRequest,
)
from app.modules.payments import services

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/checkout", response_model=CheckoutResponse)
def create_checkout(
    data: CreateCheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.payment_type == PaymentType.EXTRA_QUESTIONS and not data.consultation_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="consultation_id is required for extra_questions payment",
        )
    checkout_url, session_id = services.create_checkout_session(
        db=db,
        user_id=current_user.id,
        payment_type=data.payment_type,
        success_url=data.success_url,
        cancel_url=data.cancel_url,
        consultation_id=data.consultation_id,
    )
    return CheckoutResponse(checkout_url=checkout_url, session_id=session_id)


@router.post("/subscribe", response_model=CheckoutResponse)
def create_subscription(
    data: SubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    checkout_url, session_id = services.create_subscription_checkout(
        db=db,
        user_id=current_user.id,
        success_url=data.success_url,
        cancel_url=data.cancel_url,
    )
    return CheckoutResponse(checkout_url=checkout_url, session_id=session_id)


@router.post("/checkout-review", response_model=CheckoutResponse)
def create_review_checkout(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe checkout for a Professional Mortgage Broker Review (£50)."""
    success_url = data.get(
        "success_url", "http://localhost:5173/dashboard/strategy?review=booked"
    )
    cancel_url = data.get("cancel_url", "http://localhost:5173/dashboard/strategy")
    checkout_url, session_id = services.create_review_checkout(
        db=db,
        user_id=current_user.id,
        success_url=success_url,
        cancel_url=cancel_url,
    )
    return CheckoutResponse(checkout_url=checkout_url, session_id=session_id)


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        services.handle_checkout_completed(db, event["data"]["object"])
    elif event["type"] == "checkout.session.async_payment_failed":
        services.handle_payment_failed(db, event["data"]["object"])

    return {"status": "ok"}


@router.post("/verify")
def verify_payment(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Verify a Stripe checkout session after redirect. Activates the consultation."""
    session_id = data.get("session_id", "")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    from app.modules.payments.models import Payment, PaymentStatus

    payment = db.query(Payment).filter(Payment.stripe_session_id == session_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your payment")

    if payment.status == PaymentStatus.COMPLETED:
        return {"status": "already_verified"}

    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session")

    if session.payment_status == "paid":
        services.handle_checkout_completed(db, dict(session))
        return {"status": "verified"}

    return {"status": "pending", "payment_status": session.payment_status}


@router.get("/consultation/active", response_model=ConsultationResponse)
def get_active_consultation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.modules.payments.models import Consultation, ConsultationStatus

    consultation = (
        db.query(Consultation)
        .filter(
            Consultation.user_id == current_user.id,
            Consultation.status == ConsultationStatus.ACTIVE,
        )
        .order_by(Consultation.created_at.desc())
        .first()
    )
    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active consultation found",
        )
    return consultation


@router.get("/my-payments", response_model=PaymentListResponse)
def my_payments(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payments, total = services.get_user_payments(db, current_user.id, skip, limit)
    return PaymentListResponse(payments=payments, total=total)


@router.get("/my-consultations", response_model=ConsultationListResponse)
def my_consultations(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    consultations, total = services.get_user_consultations(
        db, current_user.id, skip, limit
    )
    return ConsultationListResponse(consultations=consultations, total=total)
