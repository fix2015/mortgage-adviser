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
  employment_type: string | null;
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

export interface ChecklistItem {
  category: string;
  label: string;
  status: "uploaded" | "missing";
  documents: string[];
}

export interface ReadinessScoreResponse {
  overall_percentage: number;
  checklist: ChecklistItem[];
  missing_documents: string[];
  employment_type: string;
  total_required: number;
  total_uploaded: number;
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

export interface ApplicantSummary {
  name: string;
  annual_income: string | null;
  employment_type: string | null;
  company: string | null;
}

export interface FinancialSummary {
  applicants: ApplicantSummary[];
  combined_income: string | null;
  estimated_deposit: string | null;
  credit_scores: string | null;
  borrowing_estimate_4x: string | null;
  borrowing_estimate_45x: string | null;
}

export interface BankSuggestion {
  lender_name: string;
  product_type: string;
  interest_rate: number;
  monthly_payment: number;
  term_years: number;
  ltv: number;
  total_cost: number;
  fees: number;
  reason: string;
}

// ---------- Lender Predictions (#38) ----------

export interface LenderPrediction {
  lender: string;
  prediction: number;
  verdict: "LIKELY" | "POSSIBLE" | "UNLIKELY";
  reason: string;
  risk_factors: string[];
  strengths: string[];
}

export interface LenderPredictionsResponse {
  predictions: LenderPrediction[];
}

// ---------- Mortgage Health Check (#37) ----------

export interface HealthCheckRequest {
  current_rate: number;
  current_balance: number;
  remaining_term: number;
  current_lender: string;
}

export interface HealthCheckResponse {
  current_monthly: number;
  best_available_monthly: number;
  monthly_saving: number;
  annual_saving: number;
  best_rate_available: number;
  switch_cost_estimate: number;
  break_even_months: number;
  recommendation: "SWITCH" | "WAIT";
  current_rate: number;
  current_balance: number;
  remaining_term: number;
  current_lender: string;
}

// ---------- Employer Reference (#40) ----------

export interface EmployerReferenceResponse {
  letter_text: string;
}
