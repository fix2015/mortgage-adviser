from celery import Celery

from app.config import settings

celery_app = Celery(
    "mortgage_adviser",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)


@celery_app.task(name="process_document")
def process_document_task(document_id: int):
    """Celery task to process a document asynchronously."""
    from app.database import SessionLocal
    from app.modules.documents.services import process_document
    from app.modules.knowledge.services import build_knowledge_from_document

    db = SessionLocal()
    try:
        document = process_document(db, document_id)
        if document.extracted_text:
            build_knowledge_from_document(db, document)
    finally:
        db.close()
