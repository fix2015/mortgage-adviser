from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.modules.documents.models import DocumentStatus


class DocumentResponse(BaseModel):
    id: int
    consultation_id: int
    user_id: int
    filename: str
    s3_key: str
    file_type: str
    file_size: int
    status: DocumentStatus
    extracted_text: Optional[str] = None
    document_type: Optional[str] = None
    checklist_category: Optional[str] = None
    structured_data: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int


class DocumentUploadResponse(BaseModel):
    id: int
    filename: str
    status: DocumentStatus
    message: str


class FolderResponse(BaseModel):
    name: str
    type: str
    icon: str
    count: int
    documents: list[DocumentResponse]


class OrganizedDocumentsResponse(BaseModel):
    folders: list[FolderResponse]
    total_documents: int
    total_folders: int
