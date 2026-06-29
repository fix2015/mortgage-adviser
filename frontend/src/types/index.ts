export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  is_active: boolean;
  created_at: string;
  buyer_type: string | null;
  income_range: string | null;
  property_value: number | null;
  onboarding_completed: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface ConsultationInfo {
  id: number;
  user_id: number;
  payment_id: number | null;
  status: "active" | "completed";
  questions_used: number;
  questions_limit: number;
  is_trial: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  session_id: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  created_at: string;
  messages: ChatMessage[];
}

export interface Document {
  id: number;
  consultation_id: number;
  user_id: number;
  filename: string;
  s3_key: string;
  file_type: string;
  file_size: number;
  status: "uploaded" | "processing" | "processed" | "error";
  extracted_text?: string | null;
  document_type?: string | null;
  structured_data?: string | null;
  error_message?: string | null;
  created_at: string;
}

export interface DocumentFolder {
  name: string;
  type: string;
  icon: string;
  count: number;
  documents: Document[];
}

export interface OrganizedDocumentsResponse {
  folders: DocumentFolder[];
  total_documents: number;
  total_folders: number;
}

export interface KnowledgeNode {
  id: string;
  label: string;
  category: "income" | "property" | "mortgage" | "deposit" | "lender" | "strategy" | "regulation";
  value: string;
  details?: string;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  label?: string;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface PaymentIntent {
  client_secret: string;
  payment_intent_id: string;
}

export interface StrategyResponse {
  id: number;
  consultation_id: number;
  title: string;
  file_size: number;
  summary: string | null;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_payments: number;
  total_revenue: number;
  active_sessions: number;
}

export interface AdminUser {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  is_active: boolean;
  has_paid: boolean;
  questions_remaining: number;
  total_documents: number;
}

export interface AdminPayment {
  id: string;
  user_id: string;
  user_email: string;
  amount: number;
  status: string;
  created_at: string;
  type: "consultation" | "extra_questions";
}

export interface ReadinessScoreResponse {
  overall: number;
  deposit_strength: number;
  income_stability: number;
  credit_readiness: number;
  recommendations: string[];
}

export interface MortgageCalculation {
  monthly_payment: number;
  total_interest: number;
  total_cost: number;
  ltv_ratio: number;
  stamp_duty: number;
}

export interface LenderRecommendation {
  lender: string;
  rate: number;
  type: "fixed" | "variable" | "tracker";
  term: number;
  monthly_payment: number;
  total_cost: number;
  ltv: number;
  fees: number;
  badge?: string;
}

export interface NewsArticle {
  title: string;
  date: string;
  summary: string;
  impact: "high" | "medium" | "low";
  category: string;
}

export interface NewsResponse {
  articles: NewsArticle[];
}

export interface ZipUploadResult {
  processed: number;
  skipped: number;
  errors: number;
  files: { filename: string; status: string }[];
}
