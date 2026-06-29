import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, animate, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw, CheckCircle2, XCircle, Upload, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getReadinessScore, updateEmploymentType } from "@/api/chat";
import type { ReadinessScoreResponse, ChecklistItem } from "@/types";

const EMPLOYMENT_TABS = [
  { key: "employed", label: "Employed" },
  { key: "self_employed", label: "Self-Employed" },
  { key: "cis_contractor", label: "CIS Contractor" },
  { key: "company_director", label: "Company Director" },
] as const;

const COMMON_CATEGORIES = new Set(["id", "address", "credit_report"]);

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

function getScoreColor(s: number) {
  return s >= 70 ? "#059669" : s >= 40 ? "#D97706" : "#DC2626";
}
function getScoreLabel(s: number) {
  return s >= 70 ? "Mortgage Ready" : s >= 40 ? "Nearly There" : "Needs Work";
}
function getScoreGradient(s: number): [string, string] {
  return s >= 70 ? ["#059669", "#10b981"] : s >= 40 ? ["#D97706", "#F59E0B"] : ["#DC2626", "#EF4444"];
}

function AnimatedNumber({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const c = animate(mv, value, { duration, ease: "easeOut" });
    const u = rounded.on("change", (v) => setDisplay(v));
    return () => { c.stop(); u(); };
  }, [value, duration, mv, rounded]);
  return <>{display}</>;
}

function CircularGauge({ score }: { score: number }) {
  const size = 160;
  const sw = 12;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const [g1, g2] = getScoreGradient(score);
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="readiness-gauge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={g1} />
            <stop offset="100%" stopColor={g2} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-ds-bg-surface" strokeWidth={sw} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#readiness-gauge)" strokeWidth={sw} strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-ds-text-primary leading-none">
          <AnimatedNumber value={score} duration={1.4} />%
        </span>
        <span className="text-xs font-semibold mt-1.5" style={{ color: getScoreColor(score) }}>
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

function DocumentTable({ items, employmentType }: { items: ChecklistItem[]; employmentType: string }) {
  const uploadedItems = items.filter(i => i.status === "uploaded");
  const missingItems = items.filter(i => i.status === "missing");

  return (
    <div className="space-y-5">
      {/* Documents You Have */}
      {uploadedItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#059669" }} />
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#059669" }}>Documents You Have</h4>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>{uploadedItems.length} uploaded</span>
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
                {uploadedItems.map((item, idx) => (
                  <tr key={item.category} className={idx % 2 === 0 ? "bg-white" : "bg-ds-bg-tertiary"}>
                    <td className="px-4 py-3 font-medium text-ds-text-primary border-b border-ds-border-default">{item.label}</td>
                    <td className="px-4 py-3 text-center border-b border-ds-border-default"><StatusBadge status="uploaded" /></td>
                    <td className="px-4 py-3 text-ds-text-secondary text-xs border-b border-ds-border-default">
                      {item.documents.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.documents.map((doc, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-ds-bg-surface rounded px-1.5 py-0.5">
                              <FileText className="h-2.5 w-2.5" />{doc}
                            </span>
                          ))}
                        </div>
                      ) : "Uploaded"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Documents Still Needed */}
      {missingItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#dc2626" }} />
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#dc2626" }}>Documents Still Needed</h4>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>{missingItems.length} missing</span>
          </div>
          <div className="rounded-lg border border-ds-border-default overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#fef2f2" }}>
                  <th className="text-left text-xs font-semibold text-ds-text-secondary px-4 py-2.5 border-b border-ds-border-default">Document</th>
                  <th className="text-center text-xs font-semibold text-ds-text-secondary px-4 py-2.5 border-b border-ds-border-default w-28">Status</th>
                  <th className="text-left text-xs font-semibold text-ds-text-secondary px-4 py-2.5 border-b border-ds-border-default">Why It's Needed</th>
                  <th className="text-center text-xs font-semibold text-ds-text-secondary px-4 py-2.5 border-b border-ds-border-default w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {missingItems.map((item, idx) => (
                  <tr key={item.category} className={idx % 2 === 0 ? "bg-white" : "bg-ds-bg-tertiary"}>
                    <td className="px-4 py-3 font-medium text-ds-text-primary border-b border-ds-border-default">{item.label}</td>
                    <td className="px-4 py-3 text-center border-b border-ds-border-default"><StatusBadge status="missing" /></td>
                    <td className="px-4 py-3 text-ds-text-secondary text-xs border-b border-ds-border-default">{getWhyNeeded(item.category, employmentType)}</td>
                    <td className="px-4 py-3 text-center border-b border-ds-border-default">
                      <Link to="/dashboard/documents">
                        <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 px-2">
                          <Upload className="h-3 w-3" />Upload
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReadinessScore() {
  const [data, setData] = useState<ReadinessScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [switchingTab, setSwitchingTab] = useState(false);

  const fetchScore = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      try {
        const c = localStorage.getItem("readiness_cache");
        if (c) {
          const { data: d, timestamp } = JSON.parse(c);
          if (Date.now() - timestamp < 3600000) {
            setData(d);
            setLoading(false);
            return;
          }
        }
      } catch { /* ignored */ }
    }
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const result = await getReadinessScore();
      setData(result);
      localStorage.setItem("readiness_cache", JSON.stringify({ data: result, timestamp: Date.now() }));
    } catch { /* fail silently */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchScore(); }, [fetchScore]);

  const handleTabChange = async (empType: string) => {
    if (switchingTab || data?.employment_type === empType) return;
    setSwitchingTab(true);
    try {
      await updateEmploymentType(empType);
      localStorage.removeItem("readiness_cache");
      await fetchScore(true);
    } catch { /* ignored */ }
    finally { setSwitchingTab(false); }
  };

  if (loading) {
    return (
      <Card variant="glass">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-center">
            <div className="h-[160px] w-[160px] rounded-full border-[12px] border-ds-bg-surface" />
          </div>
        </div>
      </Card>
    );
  }
  if (!data) return null;

  const commonItems = data.checklist.filter((item) => COMMON_CATEGORIES.has(item.category));
  const employmentItems = data.checklist.filter((item) => !COMMON_CATEGORIES.has(item.category));
  const totalUploaded = data.checklist.filter((i) => i.status === "uploaded").length;
  const totalRequired = data.checklist.length;
  const remaining = totalRequired - totalUploaded;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card variant="glass" className="relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-ds-text-primary">Document Readiness</h3>
            <p className="text-[11px] text-ds-text-muted mt-0.5">Based on your employment type</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => fetchScore(true)} disabled={refreshing || switchingTab} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", (refreshing || switchingTab) && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Employment type tabs */}
        <div className="flex rounded-lg border border-ds-border-default bg-ds-bg-tertiary p-0.5 mb-6">
          {EMPLOYMENT_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              disabled={switchingTab}
              className={cn(
                "flex-1 text-xs font-medium py-2 px-2 rounded-md transition-all duration-200",
                data.employment_type === tab.key
                  ? "bg-ds-accent-primary text-white shadow-sm"
                  : "text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-bg-surface"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Gauge + Checklist */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
          <div className="shrink-0">
            <CircularGauge score={data.overall_percentage} />
          </div>
          <div className="flex-1 w-full space-y-5">
            <DocumentTable items={[...commonItems, ...employmentItems]} employmentType={data.employment_type} />
          </div>
        </div>

        {/* Summary bar */}
        <div className="mt-6 pt-4 border-t border-ds-border-default">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ds-text-secondary">
              <span className="font-semibold text-ds-text-primary">{totalUploaded}</span> of{" "}
              <span className="font-semibold text-ds-text-primary">{totalRequired}</span> documents uploaded
            </span>
            {remaining > 0 && (
              <span className="text-ds-feedback-warning font-medium">{remaining} remaining</span>
            )}
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-ds-bg-surface overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: getScoreColor(data.overall_percentage) }}
              initial={{ width: 0 }}
              animate={{ width: `${data.overall_percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
