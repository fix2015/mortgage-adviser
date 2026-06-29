from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_users: int
    total_consultations: int
    active_consultations: int
    total_payments: int
    total_revenue: int  # in pence
    total_documents: int
    total_messages: int
    total_knowledge_entries: int
