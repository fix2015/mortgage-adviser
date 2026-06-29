import uuid
from datetime import datetime, timedelta

from jose import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.modules.auth.models import RefreshToken
from app.modules.users.models import User


def create_access_token(user: User) -> str:
    expire = datetime.utcnow() + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value,
        "exp": expire,
    }
    return jwt.encode(
        payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
    )


def create_refresh_token(db: Session, user: User) -> str:
    token_value = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )
    refresh_token = RefreshToken(
        user_id=user.id,
        token=token_value,
        expires_at=expires_at,
    )
    db.add(refresh_token)
    db.commit()
    return token_value


def validate_refresh_token(db: Session, token: str) -> RefreshToken | None:
    refresh = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token == token,
            RefreshToken.is_revoked.is_(False),
            RefreshToken.expires_at > datetime.utcnow(),
        )
        .first()
    )
    return refresh


def revoke_refresh_token(db: Session, token: str) -> None:
    refresh = db.query(RefreshToken).filter(RefreshToken.token == token).first()
    if refresh:
        refresh.is_revoked = True
        db.commit()


def revoke_all_user_tokens(db: Session, user_id: int) -> None:
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.is_revoked.is_(False),
    ).update({"is_revoked": True})
    db.commit()


def create_password_reset_token(db: Session, email: str) -> str | None:
    from app.modules.users import services as user_services

    user = user_services.get_user_by_email(db, email)
    if not user:
        return None
    token = str(uuid.uuid4())
    user.password_reset_token = token
    user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()
    return token


def reset_password(db: Session, token: str, new_password: str) -> bool:
    from app.modules.users import services as user_services

    user = (
        db.query(User)
        .filter(
            User.password_reset_token == token,
            User.password_reset_expires > datetime.utcnow(),
        )
        .first()
    )
    if not user:
        return False
    user.hashed_password = user_services.hash_password(new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    return True
