import io
import json
import zipfile

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Request
from fastapi.responses import Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_active_consultation
from app.modules.users.models import User
from app.modules.payments.models import Consultation
from app.modules.documents.schemas import (
    DocumentResponse,
    DocumentListResponse,
    DocumentUploadResponse,
    FolderResponse,
    OrganizedDocumentsResponse,
)
from app.modules.documents import services
from app.modules.chat.services import clear_cache

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/documents", tags=["documents"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload", response_model=DocumentUploadResponse)
@limiter.limit("30/minute")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    # Check trial document limit (1 document for free trial)
    if getattr(consultation, "is_trial", False):
        from app.modules.documents.models import Document as DocumentModel

        doc_count = (
            db.query(DocumentModel)
            .filter(DocumentModel.consultation_id == consultation.id)
            .count()
        )
        if doc_count >= 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Free trial allows only 1 document upload. Upgrade to full consultation for unlimited uploads.",
            )

    file_content = await file.read()
    file_size = len(file_content)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds 10MB limit",
        )

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )

    try:
        document = services.create_document(
            db=db,
            consultation_id=consultation.id,
            user_id=current_user.id,
            filename=file.filename,
            file_content=file_content,
            content_type=file.content_type or "application/octet-stream",
            file_size=file_size,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # Process document inline (extract text)
    services.process_document_inline(db, document, file_content)

    # Build knowledge entries from extracted text
    if document.extracted_text:
        from app.modules.knowledge.services import build_knowledge_from_document

        build_knowledge_from_document(db, document)

    # Clear cached AI results since knowledge base changed
    clear_cache(f"readiness:{consultation.id}")
    clear_cache(f"financial_summary:{consultation.id}")

    return DocumentUploadResponse(
        id=document.id,
        filename=document.filename,
        status=document.status,
        message="Document uploaded and processed successfully",
    )


@router.post("/upload-zip")
@limiter.limit("5/minute")
async def upload_zip(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Upload a .zip archive and process all supported files inside it."""
    import zipfile
    import io
    import os

    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .zip files are accepted",
        )

    zip_content = await file.read()
    zip_size = len(zip_content)

    MAX_ZIP_SIZE = 100 * 1024 * 1024  # 100MB
    if zip_size > MAX_ZIP_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="ZIP file exceeds 100MB limit",
        )

    try:
        zf = zipfile.ZipFile(io.BytesIO(zip_content))
    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or corrupted ZIP file",
        )

    SUPPORTED_EXTENSIONS = {"pdf", "docx", "doc", "txt", "csv"}
    MAX_FILES = 50
    MAX_INDIVIDUAL_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_DEPTH = 3
    SKIP_PREFIXES = ("__MACOSX", ".DS_Store")

    results = []
    processed = 0
    skipped = 0
    errors = 0

    entries = [info for info in zf.infolist() if not info.is_dir()]

    for info in entries:
        name = info.filename
        basename = os.path.basename(name)

        # Skip hidden files and macOS artifacts
        if basename.startswith(".") or any(
            name.startswith(p) or ("/" + p) in name for p in SKIP_PREFIXES
        ):
            skipped += 1
            results.append({"filename": basename, "status": "skipped"})
            continue

        # Check depth
        depth = name.count("/")
        if depth > MAX_DEPTH:
            skipped += 1
            results.append({"filename": basename, "status": "skipped"})
            continue

        # Check extension
        ext = basename.rsplit(".", 1)[-1].lower() if "." in basename else ""
        if ext not in SUPPORTED_EXTENSIONS:
            skipped += 1
            results.append({"filename": basename, "status": "skipped"})
            continue

        # Check individual file size
        if info.file_size > MAX_INDIVIDUAL_SIZE:
            skipped += 1
            results.append({"filename": basename, "status": "skipped"})
            continue

        # Check max files
        if processed >= MAX_FILES:
            skipped += 1
            results.append({"filename": basename, "status": "skipped"})
            continue

        try:
            file_content = zf.read(info.filename)

            # Map extension to content type
            content_type_map = {
                "pdf": "application/pdf",
                "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "doc": "application/msword",
                "txt": "text/plain",
                "csv": "text/csv",
            }
            content_type = content_type_map.get(ext, "application/octet-stream")

            document = services.create_document(
                db=db,
                consultation_id=consultation.id,
                user_id=current_user.id,
                filename=basename,
                file_content=file_content,
                content_type=content_type,
                file_size=len(file_content),
            )

            services.process_document_inline(db, document, file_content)

            if document.extracted_text:
                from app.modules.knowledge.services import build_knowledge_from_document

                build_knowledge_from_document(db, document)

            processed += 1
            results.append({"filename": basename, "status": "processed"})
        except Exception as e:
            errors += 1
            results.append({"filename": basename, "status": f"error: {str(e)}"})

    zf.close()

    # Clear cached AI results since knowledge base changed
    if processed > 0:
        clear_cache(f"readiness:{consultation.id}")
        clear_cache(f"financial_summary:{consultation.id}")

    return {
        "processed": processed,
        "skipped": skipped,
        "errors": errors,
        "files": results,
    }


def _smart_rename(doc) -> str:
    """Generate a clean filename from document metadata."""
    ext = doc.filename.rsplit(".", 1)[-1] if "." in doc.filename else "pdf"
    parts = []

    # Try to extract info from structured_data
    if doc.structured_data:
        try:
            data = json.loads(doc.structured_data)
            key_data = data.get("key_data", {})
            if key_data.get("date"):
                parts.append(key_data["date"])
            if key_data.get("from"):
                # Clean company name - take first 20 chars, remove special chars
                from_name = key_data["from"][:20].strip()
                from_name = (
                    "".join(c if c.isalnum() or c in " -" else "" for c in from_name)
                    .strip()
                    .replace(" ", "_")
                )
                if from_name:
                    parts.append(from_name)
            if key_data.get("total_amount"):
                parts.append(
                    key_data["total_amount"].replace("\u00a3", "GBP").replace(",", "")
                )
        except Exception:
            pass

    if parts:
        doc_type = (
            (doc.document_type or "document")
            .replace("_", " ")
            .title()
            .replace(" ", "_")
        )
        return f"{doc_type}_{'_'.join(parts)}.{ext}"

    # Fallback to original filename
    return doc.filename


FOLDER_CONFIG = {
    "passport": {"name": "ID Documents", "icon": "id-card"},
    "payslip": {"name": "Payslips", "icon": "receipt"},
    "bank_statement": {"name": "Bank Statements", "icon": "landmark"},
    "tax_return": {"name": "Tax Returns", "icon": "file-check"},
    "contract": {"name": "Employment Contracts", "icon": "file-signature"},
    "utility_bill": {"name": "Proof of Address", "icon": "home"},
    "credit_report": {"name": "Credit Reports", "icon": "shield-check"},
    "company_accounts": {"name": "Company Accounts", "icon": "building"},
    "other": {"name": "Other Documents", "icon": "file"},
}


@router.get("/download-folder")
def download_folder(
    folder_type: str = "",
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    """Download documents as a ZIP file, optionally filtered by folder type."""
    from app.modules.documents.models import Document as DocModel

    query = db.query(DocModel).filter(DocModel.consultation_id == consultation.id)
    if folder_type:
        query = query.filter(DocModel.document_type == folder_type)
    documents = query.all()

    if not documents:
        raise HTTPException(status_code=404, detail="No documents found")

    s3 = services.get_s3_client()
    buffer = io.BytesIO()

    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for doc in documents:
            # Smart rename
            smart_name = _smart_rename(doc)
            folder = FOLDER_CONFIG.get(doc.document_type or "other", {"name": "Other"})[
                "name"
            ]
            zip_path = f"{folder}/{smart_name}"

            # Download from S3
            try:
                from app.config import settings as app_settings

                response = s3.get_object(
                    Bucket=app_settings.AWS_S3_BUCKET, Key=doc.s3_key
                )
                file_data = response["Body"].read()
                zf.writestr(zip_path, file_data)
            except Exception:
                continue  # Skip files that fail to download

    buffer.seek(0)
    filename = f"{folder_type or 'All_Documents'}.zip"
    return Response(
        content=buffer.read(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/organized", response_model=OrganizedDocumentsResponse)
def get_organized_documents(
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    documents, total = services.get_consultation_documents(
        db, consultation.id, skip=0, limit=1000
    )

    # Group documents by document_type
    grouped: dict[str, list] = {}
    for doc in documents:
        doc_type = doc.document_type or "other"
        if doc_type not in FOLDER_CONFIG:
            doc_type = "other"
        grouped.setdefault(doc_type, []).append(doc)

    folders = []
    for doc_type, config in FOLDER_CONFIG.items():
        docs = grouped.get(doc_type, [])
        if docs:
            folders.append(
                FolderResponse(
                    name=config["name"],
                    type=doc_type,
                    icon=config["icon"],
                    count=len(docs),
                    documents=[DocumentResponse.model_validate(d) for d in docs],
                )
            )

    return OrganizedDocumentsResponse(
        folders=folders,
        total_documents=total,
        total_folders=len(folders),
    )


@router.get("/", response_model=DocumentListResponse)
def list_documents(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    consultation: Consultation = Depends(get_active_consultation),
    db: Session = Depends(get_db),
):
    documents, total = services.get_consultation_documents(
        db, consultation.id, skip, limit
    )
    return DocumentListResponse(documents=documents, total=total)


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = services.get_document_by_id(db, document_id, current_user.id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return document


@router.post("/{document_id}/reprocess", response_model=DocumentResponse)
def reprocess_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retry processing a stuck document."""
    document = services.get_document_by_id(db, document_id, current_user.id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    document = services.process_document(db, document_id)
    if document.extracted_text:
        from app.modules.knowledge.services import build_knowledge_from_document

        build_knowledge_from_document(db, document)
    if document.extracted_text:
        services.classify_and_extract(db, document)
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = services.get_document_by_id(db, document_id, current_user.id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    services.delete_document(db, document)
    return None
