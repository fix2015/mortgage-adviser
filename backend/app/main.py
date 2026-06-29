from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.payments.router import router as payments_router
from app.modules.documents.router import router as documents_router
from app.modules.chat.router import router as chat_router
from app.modules.knowledge.router import router as knowledge_router
from app.modules.admin.router import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Create first admin user on boot
    from app.modules.users.models import User, UserRole
    from app.modules.users.services import get_user_by_email, hash_password

    db = SessionLocal()
    try:
        if not get_user_by_email(db, settings.FIRST_ADMIN_EMAIL):
            db.add(
                User(
                    email=settings.FIRST_ADMIN_EMAIL.lower(),
                    hashed_password=hash_password(settings.FIRST_ADMIN_PASSWORD),
                    role=UserRole.ADMIN,
                    is_active=True,
                )
            )
            db.commit()
    finally:
        db.close()

    yield


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="AI Mortgage Adviser API",
    version="1.0.0",
    docs_url="/docs" if settings.APP_DEBUG else None,
    redoc_url="/redoc" if settings.APP_DEBUG else None,
    lifespan=lifespan,
    root_path="/",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(payments_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(knowledge_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "version": "1.0.0", "platform": "AI Mortgage Adviser"}
