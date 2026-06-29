import stripe
from sqlalchemy.orm import Session

from app.config import settings
from app.modules.payments.models import (
    Payment,
    PaymentStatus,
    PaymentType,
    Consultation,
    ConsultationStatus,
)

stripe.api_key = settings.STRIPE_SECRET_KEY


def create_checkout_session(
    db: Session,
    user_id: int,
    payment_type: PaymentType,
    success_url: str,
    cancel_url: str,
    consultation_id: int | None = None,
) -> tuple[str, str]:
    if payment_type == PaymentType.CONSULTATION:
        amount = settings.STRIPE_CONSULTATION_PRICE
        product_name = "AI Mortgage Consultation (50 Questions)"
    else:
        amount = settings.STRIPE_EXTRA_QUESTIONS_PRICE
        product_name = "Extra Questions Pack (50 Questions)"

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": {
                    "currency": "gbp",
                    "product_data": {"name": product_name},
                    "unit_amount": amount,
                },
                "quantity": 1,
            }
        ],
        mode="payment",
        success_url=success_url
        + ("&" if "?" in success_url else "?")
        + "session_id={CHECKOUT_SESSION_ID}",
        cancel_url=cancel_url,
        metadata={
            "user_id": str(user_id),
            "payment_type": payment_type.value,
            "consultation_id": str(consultation_id) if consultation_id else "",
        },
    )

    payment = Payment(
        user_id=user_id,
        stripe_session_id=session.id,
        amount=amount,
        currency="gbp",
        status=PaymentStatus.PENDING,
        payment_type=payment_type,
    )
    db.add(payment)
    db.commit()

    return session.url, session.id


def create_review_checkout(
    db: Session,
    user_id: int,
    success_url: str,
    cancel_url: str,
) -> tuple[str, str]:
    """Create a Stripe checkout for Professional Mortgage Broker Review (£50)."""
    amount = 5000  # £50 in pence

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": {
                    "currency": "gbp",
                    "product_data": {"name": "Professional Mortgage Broker Review"},
                    "unit_amount": amount,
                },
                "quantity": 1,
            }
        ],
        mode="payment",
        success_url=success_url
        + ("&" if "?" in success_url else "?")
        + "session_id={CHECKOUT_SESSION_ID}",
        cancel_url=cancel_url,
        metadata={
            "user_id": str(user_id),
            "payment_type": PaymentType.BROKER_REVIEW.value,
        },
    )

    payment = Payment(
        user_id=user_id,
        stripe_session_id=session.id,
        amount=amount,
        currency="gbp",
        status=PaymentStatus.PENDING,
        payment_type=PaymentType.BROKER_REVIEW,
    )
    db.add(payment)
    db.commit()

    return session.url, session.id


def create_subscription_checkout(
    db: Session,
    user_id: int,
    success_url: str,
    cancel_url: str,
) -> tuple[str, str]:
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": {
                    "currency": "gbp",
                    "product_data": {"name": "AI Mortgage Adviser Monthly Plan"},
                    "unit_amount": 500,  # £5
                    "recurring": {"interval": "month"},
                },
                "quantity": 1,
            }
        ],
        mode="subscription",
        success_url=success_url
        + ("&" if "?" in success_url else "?")
        + "session_id={CHECKOUT_SESSION_ID}",
        cancel_url=cancel_url,
        metadata={"user_id": str(user_id), "payment_type": "subscription"},
    )

    payment = Payment(
        user_id=user_id,
        stripe_session_id=session.id,
        amount=500,
        currency="gbp",
        status=PaymentStatus.PENDING,
        payment_type=PaymentType.SUBSCRIPTION,
    )
    db.add(payment)
    db.commit()

    return session.url, session.id


def handle_checkout_completed(db: Session, session: dict) -> None:
    stripe_session_id = session["id"]
    payment = (
        db.query(Payment).filter(Payment.stripe_session_id == stripe_session_id).first()
    )
    if not payment:
        return

    payment.status = PaymentStatus.COMPLETED
    payment.stripe_payment_intent_id = session.get("payment_intent")

    metadata = session.get("metadata", {})
    payment_type = metadata.get("payment_type")
    user_id = int(metadata.get("user_id", payment.user_id))

    if payment_type == PaymentType.CONSULTATION.value:
        # Check if user has an existing trial consultation -- upgrade it instead of creating new
        existing_trial = (
            db.query(Consultation)
            .filter(
                Consultation.user_id == user_id,
                Consultation.is_trial.is_(True),
                Consultation.status == ConsultationStatus.ACTIVE,
            )
            .first()
        )
        if existing_trial:
            # Upgrade trial to paid -- preserves messages, documents, knowledge
            existing_trial.is_trial = False
            existing_trial.payment_id = payment.id
            existing_trial.questions_limit = settings.MAX_FREE_QUESTIONS
            existing_trial.status = ConsultationStatus.ACTIVE
        else:
            consultation = Consultation(
                user_id=user_id,
                payment_id=payment.id,
                status=ConsultationStatus.ACTIVE,
                questions_used=0,
                questions_limit=settings.MAX_FREE_QUESTIONS,
            )
            db.add(consultation)
    elif payment_type == PaymentType.EXTRA_QUESTIONS.value:
        consultation_id = metadata.get("consultation_id")
        if consultation_id:
            consultation = (
                db.query(Consultation)
                .filter(Consultation.id == int(consultation_id))
                .first()
            )
            if consultation:
                consultation.questions_limit += 50
                if consultation.status == ConsultationStatus.COMPLETED:
                    consultation.status = ConsultationStatus.ACTIVE
    elif payment_type == PaymentType.SUBSCRIPTION.value:
        # Subscription: 20 questions/month with ongoing access
        existing_trial = (
            db.query(Consultation)
            .filter(
                Consultation.user_id == user_id,
                Consultation.is_trial.is_(True),
                Consultation.status == ConsultationStatus.ACTIVE,
            )
            .first()
        )
        if existing_trial:
            existing_trial.is_trial = False
            existing_trial.payment_id = payment.id
            existing_trial.questions_limit = 20
            existing_trial.status = ConsultationStatus.ACTIVE
        else:
            consultation = Consultation(
                user_id=user_id,
                payment_id=payment.id,
                status=ConsultationStatus.ACTIVE,
                questions_used=0,
                questions_limit=20,
            )
            db.add(consultation)

    db.commit()


def handle_payment_failed(db: Session, session: dict) -> None:
    stripe_session_id = session["id"]
    payment = (
        db.query(Payment).filter(Payment.stripe_session_id == stripe_session_id).first()
    )
    if payment:
        payment.status = PaymentStatus.FAILED
        db.commit()


def get_user_payments(
    db: Session, user_id: int, skip: int = 0, limit: int = 50
) -> tuple[list[Payment], int]:
    query = db.query(Payment).filter(Payment.user_id == user_id)
    total = query.count()
    payments = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()
    return payments, total


def get_user_consultations(
    db: Session, user_id: int, skip: int = 0, limit: int = 50
) -> tuple[list[Consultation], int]:
    query = db.query(Consultation).filter(Consultation.user_id == user_id)
    total = query.count()
    consultations = (
        query.order_by(Consultation.created_at.desc()).offset(skip).limit(limit).all()
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


def increment_question_count(db: Session, consultation: Consultation) -> None:
    consultation.questions_used += 1
    if consultation.questions_used >= consultation.questions_limit:
        consultation.status = ConsultationStatus.COMPLETED
    db.commit()
