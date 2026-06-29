from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.modules.users.models import User
from app.modules.users.schemas import UserListResponse
from app.modules.payments.schemas import (
    PaymentListResponse,
    ConsultationListResponse,
)
from app.modules.chat.schemas import MessageListResponse
from app.modules.knowledge.schemas import KnowledgeListResponse
from app.modules.admin.schemas import DashboardStats
from app.modules.admin import services

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return services.get_dashboard_stats(db)


@router.get("/users", response_model=UserListResponse)
def list_all_users(
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users, total = services.get_all_users(db, skip, limit)
    return UserListResponse(users=users, total=total)


@router.get("/consultations", response_model=ConsultationListResponse)
def list_all_consultations(
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    consultations, total = services.get_all_consultations(db, skip, limit)
    return ConsultationListResponse(consultations=consultations, total=total)


@router.get("/payments", response_model=PaymentListResponse)
def list_all_payments(
    skip: int = 0,
    limit: int = 50,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    payments, total = services.get_all_payments(db, skip, limit)
    return PaymentListResponse(payments=payments, total=total)


@router.get("/messages", response_model=MessageListResponse)
def list_all_messages(
    consultation_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    messages, total = services.get_all_messages(db, consultation_id, skip, limit)
    return MessageListResponse(messages=messages, total=total)


@router.get("/knowledge", response_model=KnowledgeListResponse)
def list_all_knowledge(
    consultation_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    entries, total = services.get_all_knowledge_entries(
        db, consultation_id, skip, limit
    )
    return KnowledgeListResponse(entries=entries, total=total)
