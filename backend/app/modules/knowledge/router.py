from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_active_consultation
from app.modules.users.models import User
from app.modules.payments.models import Consultation
from app.modules.knowledge.models import KnowledgeCategory
from app.modules.knowledge.schemas import (
    KnowledgeListResponse,
    KnowledgeGraphResponse,
)
from app.modules.knowledge import services

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("/", response_model=KnowledgeListResponse)
def list_knowledge(
    category: Optional[KnowledgeCategory] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    entries, total = services.get_consultation_knowledge(
        db, consultation.id, category, skip, limit
    )
    return KnowledgeListResponse(entries=entries, total=total)


@router.get("/graph", response_model=KnowledgeGraphResponse)
def get_knowledge_graph(
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    graph = services.build_knowledge_graph(db, consultation.id)
    return KnowledgeGraphResponse(**graph)
