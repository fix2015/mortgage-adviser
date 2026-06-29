import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, FileText, Download, Home, Upload, ArrowRight, CreditCard, Sparkles, CheckCircle2, XCircle, Users, User as UserIcon, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments } from "@/hooks/useDocuments";
import { KnowledgeGraph } from "@/components/knowledge/KnowledgeGraph";
import { KnowledgePanel } from "@/components/knowledge/KnowledgePanel";
import { ProgressTracker } from "@/components/dashboard/ProgressTracker";
import { ReadinessScore } from "@/components/dashboard/ReadinessScore";
import { createCheckout } from "@/api/payments";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QuestionCounter } from "@/components/chat/QuestionCounter";
import { Spinner } from "@/components/ui/Spinner";
import { getActiveConsultation, verifyPayment } from "@/api/payments";
import { getStrategies, getReadinessScore, updateEmploymentType } from "@/api/chat";
import { cn } from "@/utils/cn";
import type { KnowledgeNode, ConsultationInfo, ReadinessScoreResponse } from "@/types";

const EMPLOYMENT_TABS = [
  { key: "employed", label: "Employed" },
  { key: "self_employed", label: "Self-Employed" },
  { key: "cis_contractor", label: "CIS Contractor" },
  { key: "company_director", label: "Company Director" },
] as const;

const COMMON_CATEGORIES = new Set(["id", "address", "credit_report", "deposit", "immigration"]);

// Critical = must get before applying. Important = strongly recommended.
const CRITICAL_CATEGORIES = new Set(["id", "address", "bank_statements", "tax_returns", "employment", "deposit", "company_accounts"]);
const IMPORTANT_CATEGORIES = new Set(["payslips", "credit_report", "immigration", "income"]);

const WHY_NEEDED: Record<string, Record<string, string>> = {
  common: {
    id: "Required by all UK mortgage lenders for identity verification",
    address: "Utility bill or council tax from last 3 months — confirms residency",
    immigration: "Only if non-UK/non-Irish national — proves right to reside",
    deposit: "Bank statements showing how savings were accumulated over time",
    credit_report: "Lenders check your credit score — better to check first and fix issues",
  },
  employed: {
    employment: "Confirms your role, salary, and employment terms",
    tax_returns: "Shows annual earnings and tax paid — essential for affordability",
    payslips: "Verifies regular income and any bonuses/overtime",
    bank_statements: "Shows income deposits, spending habits, and commitments",
    income: "Confirms your role, salary, and employment terms",
  },
  self_employed: {
    tax_returns: "HMRC-issued tax calculations — main income proof for self-employed",
    bank_statements: "Shows business and personal cash flow patterns",
    income: "HMRC-issued tax calculations — main income proof for self-employed",
  },
  cis_contractor: {
    employment: "Confirms how long you've been contracting in construction",
    tax_returns: "Tax calculation from HMRC for your CIS income",
    payslips: "Shows regular CIS payment patterns",
    bank_statements: "Verifies CIS income deposits",
    income: "Tax calculation from HMRC for your CIS income",
  },
  company_director: {
    tax_returns: "Shows salary + dividend income declared to HMRC",
    income: "Filed accounts proving company profits can sustain your dividends",
    employment: "Letter confirming income, company health, and projected earnings",
    bank_statements: "Shows salary + dividend income declared to HMRC",
    company_accounts: "Filed accounts proving company profits can sustain your dividends",
    accountant_reference: "Letter confirming income, company health, and projected earnings",
  },
};

function getWhyNeeded(category: string, employmentType: string): string {
  return WHY_NEEDED.common[category]
    || WHY_NEEDED[employmentType]?.[category]
    || "Required for your mortgage application";
}

function StatusBadge({ status }: { status: "uploaded" | "partial" | "missing" }) {
  if (status === "uploaded") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md" style={{ backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>
        <CheckCircle2 className="h-3.5 w-3.5" />YES
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md" style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
        <AlertCircle className="h-3.5 w-3.5" />PARTIAL
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md" style={{ backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }}>
      <XCircle className="h-3.5 w-3.5" />MISSING
    </span>
  );
}

function NoDocumentsView({ user, consultation, questionsLimit }: { user: ReturnType<typeof useAuth>["user"]; consultation: ConsultationInfo; questionsLimit: number }) {
  const [readiness, setReadiness] = useState<ReadinessScoreResponse | null>(null);
  const [switching, setSwitching] = useState(false);
  const [isJoint, setIsJoint] = useState(false);

  const fetchReadiness = useCallback(async () => {
    try {
      const result = await getReadinessScore();
      setReadiness(result);
    } catch { /* ignored */ }
  }, []);

  useEffect(() => { fetchReadiness(); }, [fetchReadiness]);

  const handleTabChange = async (empType: string) => {
    if (switching || readiness?.employment_type === empType) return;
    setSwitching(true);
    try {
      await updateEmploymentType(empType);
      await fetchReadiness();
    } catch { /* ignored */ }
    finally { setSwitching(false); }
  };

  const commonItems = readiness?.checklist.filter((item) => COMMON_CATEGORIES.has(item.category)) ?? [];
  const employmentItems = readiness?.checklist.filter((item) => !COMMON_CATEGORIES.has(item.category)) ?? [];

  return (
    <div className="h-full overflow-auto p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        {consultation.is_trial && (
          <div className="mb-8 rounded-xl border border-ds-accent-secondary/30 bg-ds-accent-secondary/5 px-4 py-3 text-sm text-ds-text-secondary">
            <Sparkles className="inline h-4 w-4 text-ds-accent-secondary mr-1.5 -mt-0.5" />
            Free trial — {questionsLimit} questions & 1 document upload.{" "}
            <button onClick={async () => { try { const url = await createCheckout("consultation"); window.location.href = url; } catch { /* ignored */ } }} className="text-ds-text-accent hover:underline font-medium">Upgrade for £15</button>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20 mx-auto mb-6">
            <Upload className="h-10 w-10 text-ds-text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-ds-text-primary mb-3">Welcome, {user?.full_name?.split(" ")[0] || "there"}!</h1>
          <p className="text-sm text-ds-text-muted max-w-lg mx-auto leading-relaxed">
            Upload your documents to get started. Here is what we need based on your employment type.
          </p>
        </div>

        {/* Solo or Joint application */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => setIsJoint(false)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-3 border-2 transition-all",
              !isJoint
                ? "border-ds-accent-primary bg-ds-accent-primary/10 text-ds-text-accent"
                : "border-ds-border-default text-ds-text-secondary hover:border-ds-border-strong"
            )}
          >
            <UserIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Solo Application</span>
          </button>
          <button
            onClick={() => setIsJoint(true)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-3 border-2 transition-all",
              isJoint
                ? "border-ds-accent-primary bg-ds-accent-primary/10 text-ds-text-accent"
                : "border-ds-border-default text-ds-text-secondary hover:border-ds-border-strong"
            )}
          >
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Joint Application</span>
          </button>
        </div>

        {/* Employment type selector */}
        <div className="flex rounded-lg border border-ds-border-default bg-ds-bg-tertiary p-0.5 mb-6">
          {EMPLOYMENT_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              disabled={switching}
              className={cn(
                "flex-1 text-xs font-medium py-2 px-2 rounded-md transition-all duration-200",
                readiness?.employment_type === tab.key
                  ? "bg-ds-accent-primary text-white shadow-sm"
                  : "text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-bg-surface"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Document checklist — professional two-section table */}
        {readiness && (() => {
          const allItems = [...commonItems, ...employmentItems];
          const uploadedItems = allItems.filter(i => i.status === "uploaded");
          const missingItems = allItems.filter(i => i.status === "missing");
          const empLabel = EMPLOYMENT_TABS.find(t => t.key === readiness.employment_type)?.label || "Employment";

          const applicants = [
            { label: "Applicant 1", prefix: "", items: allItems },
            ...(isJoint ? [{ label: "Applicant 2 (Partner)", prefix: "partner_", items: allItems }] : []),
          ];

          return (
            <div className="space-y-6">
              {applicants.map((applicant) => {
                const appUploaded = applicant.prefix ? [] : uploadedItems;
                const appMissing = applicant.prefix ? allItems : missingItems;

                return (
                  <div key={applicant.label} className="space-y-5">
                    {applicants.length > 1 && (
                      <h3 className="text-sm font-bold text-ds-text-primary border-b border-ds-border-default pb-2">{applicant.label} — {empLabel}</h3>
                    )}

                    {/* Documents You Have */}
                    {appUploaded.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#059669" }} />
                          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#059669" }}>Documents You Have</h4>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>{appUploaded.length} uploaded</span>
                        </div>
                        <div className="rounded-lg border border-ds-border-default overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr style={{ backgroundColor: "#f0fdf4" }}>
                                <th className="text-left text-xs font-semibold text-ds-text-secondary px-4 py-2.5 border-b border-ds-border-default">Document</th>
                                <th className="text-center text-xs font-semibold text-ds-text-secondary px-4 py-2.5 border-b border-ds-border-default w-28">Status</th>
                                <th className="text-left text-xs font-semibold text-ds-text-secondary px-4 py-2.5 border-b border-ds-border-default">Details</th>
                              </tr>
                            </thead>
                            <tbody>
                              {appUploaded.map((item, idx) => (
                                <tr key={applicant.prefix + item.category} className={idx % 2 === 0 ? "bg-white" : "bg-ds-bg-tertiary"}>
                                  <td className="px-4 py-3 font-medium text-ds-text-primary border-b border-ds-border-default">{item.label}</td>
                                  <td className="px-4 py-3 text-center border-b border-ds-border-default"><StatusBadge status="uploaded" /></td>
                                  <td className="px-4 py-3 text-ds-text-secondary text-xs border-b border-ds-border-default">{item.documents.length > 0 ? item.documents.join(", ") : "Uploaded"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Documents Still Needed — split Critical vs Important */}
                    {appMissing.length > 0 && (() => {
                      const criticalMissing = appMissing.filter(i => CRITICAL_CATEGORIES.has(i.category));
                      const importantMissing = appMissing.filter(i => !CRITICAL_CATEGORIES.has(i.category));

                      const renderMissingTable = (items: typeof appMissing, title: string, color: string, bgColor: string, headerBg: string, badgeStyle: { bg: string; text: string }) => items.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{title}</h4>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}>{items.length} missing</span>
                          </div>
                          <div className="rounded-lg border border-ds-border-default overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr style={{ backgroundColor: headerBg }}>
                                  <th className="text-left text-xs font-semibold text-ds-text-secondary px-4 py-2.5 border-b border-ds-border-default">Document</th>
                                  <th className="text-center text-xs font-semibold text-ds-text-secondary px-4 py-2.5 border-b border-ds-border-default w-28">Status</th>
                                  <th className="text-left text-xs font-semibold text-ds-text-secondary px-4 py-2.5 border-b border-ds-border-default">Why It's Needed</th>
                                  <th className="text-center text-xs font-semibold text-ds-text-secondary px-4 py-2.5 border-b border-ds-border-default w-24">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item, idx) => (
                                  <tr key={applicant.prefix + item.category} className={idx % 2 === 0 ? "bg-white" : "bg-ds-bg-tertiary"}>
                                    <td className="px-4 py-3 font-medium text-ds-text-primary border-b border-ds-border-default">{item.label}</td>
                                    <td className="px-4 py-3 text-center border-b border-ds-border-default"><StatusBadge status="missing" /></td>
                                    <td className="px-4 py-3 text-ds-text-secondary text-xs border-b border-ds-border-default">{getWhyNeeded(item.category, readiness.employment_type)}</td>
                                    <td className="px-4 py-3 text-center border-b border-ds-border-default">
                                      <Link to="/dashboard/documents">
                                        <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 px-2"><Upload className="h-3 w-3" />Upload</Button>
                                      </Link>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );

                      return (
                        <div className="space-y-5">
                          {renderMissingTable(criticalMissing, "Critical — Must Get Before Applying", "#dc2626", "#fee2e2", "#fef2f2", { bg: "#fee2e2", text: "#991b1b" })}
                          {renderMissingTable(importantMissing, "Important — Strongly Recommended", "#d97706", "#fef3c7", "#fffbeb", { bg: "#fef3c7", text: "#92400e" })}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}

              <div className="text-center pt-4">
                <Link to="/dashboard/documents">
                  <Button variant="glow" size="xl" rightIcon={<ArrowRight className="h-5 w-5" />}>Upload Your Documents</Button>
                </Link>
                <p className="mt-4 text-xs text-ds-text-muted">Supported: PDF, DOC, DOCX, TXT. All files encrypted.</p>
              </div>
            </div>
          );
        })()}
      </motion.div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { documents } = useDocuments();
  const [searchParams] = useSearchParams();
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [consultation, setConsultation] = useState<ConsultationInfo | null>(null);
  const [consultationLoading, setConsultationLoading] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [strategyCount, setStrategyCount] = useState(0);

  useEffect(() => {
    const sessionId = searchParams.get("session_id"); const payment = searchParams.get("payment");
    const load = async () => {
      if (payment === "success" && sessionId) { try { await verifyPayment(sessionId); setPaymentVerified(true); } catch { /* ignored */ } }
      try { const c = await getActiveConsultation(); setConsultation(c); } catch { /* ignored */ setConsultation(null); }
      try { const s = await getStrategies(); setStrategyCount(s.total); } catch { /* ignored */ setStrategyCount(0); }
      setConsultationLoading(false);
    };
    load();
  }, [searchParams]);

  if (consultationLoading) return <div className="flex items-center justify-center min-h-screen p-6"><Spinner size="lg" /></div>;

  if (!consultation) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20 mx-auto mb-6"><CreditCard className="h-8 w-8 text-ds-text-accent" /></div>
          <h2 className="text-2xl font-bold text-ds-text-primary mb-3">Complete Your Payment</h2>
          <p className="text-ds-text-secondary mb-8">Pay just £15 to unlock your full AI mortgage consultation with 50 questions, document analysis, and lender matching.</p>
          <Button variant="glow" size="xl" rightIcon={<ArrowRight className="h-5 w-5" />} onClick={async () => { try { const url = await createCheckout("consultation"); window.location.href = url; } catch { /* ignored */ } }}>Pay £15 to Get Started</Button>
          <p className="mt-4 text-xs text-ds-text-muted">Secure payment via Stripe.</p>
        </motion.div>
      </div>
    );
  }

  const questionsUsed = consultation.questions_used; const questionsLimit = consultation.questions_limit; const questionsLeft = questionsLimit - questionsUsed; const hasDocuments = documents.length > 0;

  if (!hasDocuments) {
    return <NoDocumentsView user={user} consultation={consultation} questionsLimit={questionsLimit} />;
  }

  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      {paymentVerified && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-ds-feedback-success/30 bg-ds-feedback-success/10 p-4 flex items-center gap-3"><Sparkles className="h-5 w-5 text-ds-feedback-success shrink-0" /><p className="text-sm font-medium text-ds-text-primary">Payment successful! Full consultation active — 50 questions, unlimited documents, and lender matching.</p></motion.div>}
      {consultation.is_trial && !paymentVerified && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-ds-accent-secondary/30 bg-ds-accent-secondary/5 p-4 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-ds-accent-secondary shrink-0" /><div><p className="text-sm font-medium text-ds-text-primary">You're on a free trial ({questionsLimit} questions, 1 document)</p><p className="text-xs text-ds-text-secondary mt-0.5">Upgrade for full access for £15.</p></div></div><Link to="/dashboard"><Button variant="glow" size="sm">Upgrade for £15</Button></Link></motion.div>}

      <ProgressTracker documentsCount={documents.length} hasProcessedDocument={documents.some((d) => d.status === "processed")} questionsUsed={questionsUsed} questionsLimit={questionsLimit} hasDownloadedReport={localStorage.getItem("report_downloaded") === "true"} />
      <ReadinessScore />

      <div><h1 className="text-2xl font-bold text-ds-text-primary">Welcome back, {user?.full_name?.split(" ")[0] || "there"}</h1><p className="text-sm text-ds-text-secondary mt-1">Your AI mortgage consultation dashboard</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}><Card className="hover:border-ds-border-strong transition-colors"><div className="flex items-center gap-3 mb-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ds-accent-primary/10"><FileText className="h-4 w-4 text-ds-text-accent" /></div><span className="text-sm text-ds-text-secondary">Documents</span></div><p className="text-3xl font-bold text-ds-text-primary">{documents.length}</p></Card></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}><Card className="hover:border-ds-border-strong transition-colors"><div className="flex items-center gap-3 mb-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ds-feedback-success/10"><MessageSquare className="h-4 w-4 text-ds-feedback-success" /></div><span className="text-sm text-ds-text-secondary">Questions Left</span></div><p className="text-3xl font-bold text-ds-text-primary">{questionsLeft}</p><QuestionCounter used={questionsUsed} total={questionsLimit} className="mt-3" /></Card></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><Card className="hover:border-ds-border-strong transition-colors"><div className="flex items-center gap-3 mb-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ds-accent-secondary/10"><Download className="h-4 w-4 text-ds-accent-secondary" /></div><span className="text-sm text-ds-text-secondary">Strategies</span></div><p className="text-3xl font-bold text-ds-text-primary">{strategyCount}</p></Card></motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/dashboard/documents"><Card className="hover:border-ds-accent-primary/30 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group"><Upload className="h-6 w-6 text-ds-text-accent mb-3 group-hover:scale-110 transition-transform" /><h3 className="text-sm font-semibold text-ds-text-primary">Upload Documents</h3><p className="text-xs text-ds-text-muted mt-1">Payslips, bank statements, ID</p></Card></Link>
        <Link to="/dashboard/chat"><Card className="hover:border-ds-accent-primary/30 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group"><MessageSquare className="h-6 w-6 text-ds-feedback-success mb-3 group-hover:scale-110 transition-transform" /><h3 className="text-sm font-semibold text-ds-text-primary">Start Chat</h3><p className="text-xs text-ds-text-muted mt-1">Ask about mortgage options</p></Card></Link>
        <Link to="/dashboard/calculator"><Card className="hover:border-ds-accent-primary/30 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group"><Home className="h-6 w-6 text-ds-accent-secondary mb-3 group-hover:scale-110 transition-transform" /><h3 className="text-sm font-semibold text-ds-text-primary">Calculator</h3><p className="text-xs text-ds-text-muted mt-1">Calculate monthly payments</p></Card></Link>
      </div>

      <Card className="p-0 overflow-hidden"><div className="flex items-center gap-2 px-6 py-4 border-b border-ds-border-default"><Home className="h-4 w-4 text-ds-text-accent" /><h2 className="text-sm font-semibold text-ds-text-primary">Knowledge Graph</h2></div><div className="relative h-[400px]"><KnowledgeGraph onNodeClick={setSelectedNode} /><KnowledgePanel node={selectedNode} onClose={() => setSelectedNode(null)} /></div></Card>
    </div>
  );
}
