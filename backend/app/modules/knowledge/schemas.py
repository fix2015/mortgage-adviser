from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.modules.knowledge.models import KnowledgeCategory


class KnowledgeEntryResponse(BaseModel):
    id: int
    consultation_id: int
    category: KnowledgeCategory
    title: str
    content: str
    source_document_id: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeListResponse(BaseModel):
    entries: list[KnowledgeEntryResponse]
    total: int


class KnowledgeNode(BaseModel):
    id: str
    label: str
    category: str
    size: int = 1


class KnowledgeEdge(BaseModel):
    source: str
    target: str
    label: str = ""


class KnowledgeGraphResponse(BaseModel):
    nodes: list[KnowledgeNode]
    edges: list[KnowledgeEdge]
