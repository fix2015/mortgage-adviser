from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    APP_ENV: str = "development"
    APP_SECRET_KEY: str = "change-me-in-production"
    APP_DEBUG: bool = False
    APP_ALLOWED_ORIGINS: str = "http://localhost:5173"

    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        return [o.strip() for o in self.APP_ALLOWED_ORIGINS.split(",")]

    DATABASE_URL: str = (
        "postgresql://mortgage_user:mortgage_pass@localhost:5432/mortgage_db"
    )
    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_CONSULTATION_PRICE: int = 1500  # £15 in pence
    STRIPE_EXTRA_QUESTIONS_PRICE: int = 5000  # £50 in pence

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "gport"
    AWS_S3_REGION: str = "eu-central-1"
    AWS_S3_PREFIX: str = "mortgage-adviser"

    @property
    def S3_BASE_URL(self) -> str:
        return f"https://{self.AWS_S3_BUCKET}.s3.{self.AWS_S3_REGION}.amazonaws.com/{self.AWS_S3_PREFIX}"

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@mortgage-advisor.probooking.app"

    FIRST_ADMIN_EMAIL: str = "admin@mortgage-advisor.probooking.app"
    FIRST_ADMIN_PASSWORD: str = "admin"
    MAX_FREE_QUESTIONS: int = 50


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
