import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.users.schemas import (
    UserResponse,
    UserUpdate,
    MortgageInfoUpdate,
    PartnerInviteRequest,
    PartnerInviteResponse,
    PartnerStatusResponse,
)
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


@router.post("/invite-partner", response_model=PartnerInviteResponse)
def invite_partner(
    data: PartnerInviteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate an invite link for a partner/spouse to join as co-applicant."""
    if current_user.partner_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a linked partner",
        )

    invite_token = str(uuid.uuid4())
    current_user.invite_token = invite_token
    current_user.invited_partner_email = data.email.lower().strip()
    current_user.invited_partner_name = data.name.strip()
    db.commit()

    invite_url = f"https://mortgage-advisor.probooking.app/register?invite={invite_token}&partner={current_user.id}"
    return PartnerInviteResponse(invite_url=invite_url, invite_token=invite_token)


@router.get("/partner-status", response_model=PartnerStatusResponse)
def get_partner_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the status of the partner invite/link."""
    has_partner = current_user.partner_user_id is not None
    partner_email = None
    partner_name = None
    partner_registered = False

    if has_partner:
        partner = services.get_user_by_id(db, current_user.partner_user_id)
        if partner:
            partner_email = partner.email
            partner_name = partner.full_name
            partner_registered = True

    return PartnerStatusResponse(
        has_partner=has_partner,
        partner_email=partner_email,
        partner_name=partner_name,
        partner_registered=partner_registered,
        invited_email=current_user.invited_partner_email,
        invited_name=current_user.invited_partner_name,
    )


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
