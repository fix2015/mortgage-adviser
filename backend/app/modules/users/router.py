import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.users.schemas import UserResponse, UserUpdate, MortgageInfoUpdate
from app.modules.users import services

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.email:
        existing = services.get_user_by_email(db, data.email)
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already taken",
            )
    update_data = data.model_dump(exclude_unset=True, exclude={"is_active"})
    if data.email:
        update_data["email"] = data.email.lower().strip()
    return services.update_user(db, current_user, **update_data)


@router.patch("/me/mortgage-info", response_model=UserResponse)
def update_mortgage_info(
    data: MortgageInfoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    valid_employment_types = {
        "employed",
        "self_employed",
        "cis_contractor",
        "company_director",
    }

    if data.employment_type and data.employment_type not in valid_employment_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid employment_type. Must be one of: {', '.join(valid_employment_types)}",
        )

    update_data = data.model_dump(exclude_unset=True)
    update_data["onboarding_completed"] = True
    return services.update_user(db, current_user, **update_data)


@router.get("/me/export")
def export_my_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export all user data as JSON for GDPR compliance."""
    data = services.export_user_data(db, current_user.id)
    json_bytes = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
    return Response(
        content=json_bytes,
        media_type="application/json",
        headers={
            "Content-Disposition": 'attachment; filename="my_data_export.json"',
        },
    )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete the current user's account and all associated data (GDPR right to erasure)."""
    services.delete_user_account(db, current_user.id)
    return None
