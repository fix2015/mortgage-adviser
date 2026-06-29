from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.modules.chat.models import MessageRole


class ChatRequest(BaseModel):
    message: str
    agent: str = "mortgage"  # "mortgage", "ftb", "btl"


class MessageResponse(BaseModel):
    id: int
    consultation_id: int
    user_id: int
    role: MessageRole
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    message: MessageResponse
    questions_used: int
    questions_limit: int


class MessageListResponse(BaseModel):
    messages: list[MessageResponse]
    total: int


class StrategyReportRequest(BaseModel):
    title: str = "Mortgage Strategy Report"


class MortgageCalcRequest(BaseModel):
    property_value: int
    deposit: int
    term_years: int = 25
    interest_rate: float = 4.5


class MortgageCalcResponse(BaseModel):
    monthly_payment: int  # in pence
    total_interest: int  # in pence
    total_cost: int  # in pence
    ltv_ratio: float
    stamp_duty: int  # in pence
    loan_amount: int  # in pence


class ReadinessChecklistItem(BaseModel):
    category: str
    label: str
    status: str  # "uploaded", "missing"
    documents: list[str] = []


class ReadinessResponse(BaseModel):
    overall_percentage: int
    checklist: list[ReadinessChecklistItem]
    missing_documents: list[str]
    employment_type: Optional[str] = None


class CompareBanksRequest(BaseModel):
    property_value: int
    deposit: int
    annual_income: int
    employment_type: str = "employed"
    term_years: int = 25
    first_time_buyer: bool = True


class LenderRecommendation(BaseModel):
    lender_name: str
    product_type: str
    interest_rate: float
    monthly_payment: int
    term_years: int
    ltv: float
    total_cost: int
    fees: int
    reason: str


class CompareBanksResponse(BaseModel):
    recommendations: list[LenderRecommendation]


class StrategyResponse(BaseModel):
    id: int
    consultation_id: int
    title: str
    file_size: int
    summary: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class StrategyListResponse(BaseModel):
    strategies: list[StrategyResponse]
    total: int


class MortgageComparisonResponse(BaseModel):
    id: int
    consultation_id: int
    user_id: int
    lender_name: str
    product_type: str
    interest_rate: float
    monthly_payment: int
    term_years: int
    ltv: float
    total_cost: int
    fees: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ApplicantSummary(BaseModel):
    name: str = "Applicant"
    annual_income: Optional[str] = None
    employment_type: Optional[str] = None
    company: Optional[str] = None


class FinancialSummaryResponse(BaseModel):
    applicants: list[ApplicantSummary] = []
    combined_income: Optional[str] = None
    estimated_deposit: Optional[str] = None
    credit_scores: Optional[str] = None
    borrowing_estimate_4x: Optional[str] = None
    borrowing_estimate_45x: Optional[str] = None


class NewsArticle(BaseModel):
    title: str
    date: str
    summary: str
    impact: str = "medium"
    category: str = "general"


class NewsResponse(BaseModel):
    articles: list[NewsArticle]
