from fastapi import APIRouter, Depends, HTTPException, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.modules.auth import services as auth_services
from app.modules.users import services as user_services
from app.modules.payments.models import (
    Consultation,
    ConsultationStatus,
    Payment,
    PaymentStatus,
    PaymentType,
)

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit("5/minute")
def register(request: Request, data: RegisterRequest, db: Session = Depends(get_db)):
    existing = user_services.get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    if len(data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters",
        )
    user = user_services.create_user(
        db, email=data.email, password=data.password, full_name=data.full_name
    )

    # Create free trial payment (£0)
    trial_payment = Payment(
        user_id=user.id,
        amount=0,
        currency="gbp",
        status=PaymentStatus.COMPLETED,
        payment_type=PaymentType.CONSULTATION,
        stripe_session_id=f"trial_{user.id}",
    )
    db.add(trial_payment)
    db.flush()

    # Create free trial consultation with 3 questions limit
    trial_consultation = Consultation(
        user_id=user.id,
        payment_id=trial_payment.id,
        status=ConsultationStatus.ACTIVE,
        questions_used=0,
        questions_limit=3,
        is_trial=True,
    )
    db.add(trial_consultation)
    db.commit()

    access_token = auth_services.create_access_token(user)
    refresh_token = auth_services.create_refresh_token(db, user)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    user = user_services.get_user_by_email(db, data.email)
    if not user or not user_services.verify_password(
        data.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )
    access_token = auth_services.create_access_token(user)
    refresh_token = auth_services.create_refresh_token(db, user)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    refresh = auth_services.validate_refresh_token(db, data.refresh_token)
    if not refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    user = user_services.get_user_by_id(db, refresh.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated",
        )
    # Revoke old token and issue new pair
    auth_services.revoke_refresh_token(db, data.refresh_token)
    access_token = auth_services.create_access_token(user)
    new_refresh_token = auth_services.create_refresh_token(db, user)
    return TokenResponse(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(data: RefreshRequest, db: Session = Depends(get_db)):
    auth_services.revoke_refresh_token(db, data.refresh_token)
    return None


@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(
    request: Request, data: ForgotPasswordRequest, db: Session = Depends(get_db)
):
    token = auth_services.create_password_reset_token(db, data.email)
    response = {
        "message": "If an account with that email exists, a reset link has been sent."
    }
    # Include token in response for development (no SMTP configured yet)
    if token:
        response["token"] = token
    return response


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters",
        )
    success = auth_services.reset_password(db, data.token, data.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    return {"message": "Password has been reset successfully."}
