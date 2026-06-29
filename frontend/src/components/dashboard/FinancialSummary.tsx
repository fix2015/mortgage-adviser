import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw, User, Briefcase, PoundSterling, CreditCard, TrendingUp, Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getFinancialSummary } from "@/api/chat";
import type { FinancialSummary as FinancialSummaryType } from "@/types";
import { cn } from "@/utils/cn";

const CACHE_KEY = "financial_summary_cache";
const CACHE_TTL = 3600000; // 1 hour

function formatEmploymentType(type: string | null): string {
  if (!type) return "Unknown";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3 border-b border-ds-border-default last:border-0">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-ds-bg-surface animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-3 w-24 rounded bg-ds-bg-surface animate-pulse" />
          <div className="h-2.5 w-16 rounded bg-ds-bg-surface animate-pulse" />
        </div>
      </div>
      <div className="h-4 w-20 rounded bg-ds-bg-surface animate-pulse" />
    </div>
  );
}

export function FinancialSummary() {
  const [data, setData] = useState<FinancialSummaryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data: d, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setData(d);
            setLoading(false);
            return;
          }
        }
      } catch { /* ignored */ }
    }
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const result = await getFinancialSummary();
      setData(result);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, timestamp: Date.now() }));
    } catch { /* fail silently */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  if (loading) {
    return (
      <Card variant="glass">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-ds-text-primary">Financial Summary</h3>
            <p className="text-[11px] text-ds-text-muted mt-0.5">Extracted from your documents</p>
          </div>
        </div>
        <div className="space-y-1">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </Card>
    );
  }

  if (!data || (data.applicants.length === 0 && !data.combined_income)) return null;

  const hasBorrowingEstimate = data.borrowing_estimate_4x && data.borrowing_estimate_45x;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card variant="glass" className="relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-ds-text-primary">Financial Summary</h3>
            <p className="text-[11px] text-ds-text-muted mt-0.5">Extracted from your documents</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => fetchSummary(true)} disabled={refreshing} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Applicants */}
        {data.applicants.length > 0 && (
          <div className="space-y-3 mb-5">
            {data.applicants.map((applicant, idx) => (
              <div key={idx} className="rounded-lg border border-ds-border-default bg-ds-bg-tertiary p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ds-accent-primary/10">
                    <User className="h-3.5 w-3.5 text-ds-text-accent" />
                  </div>
                  <span className="text-sm font-semibold text-ds-text-primary">{applicant.name}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {applicant.annual_income && (
                    <div className="flex items-center gap-2">
                      <PoundSterling className="h-3.5 w-3.5 text-ds-text-muted" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-ds-text-muted">Annual Income</p>
                        <p className="text-sm font-semibold text-ds-text-primary">{applicant.annual_income}</p>
                      </div>
                    </div>
                  )}
                  {applicant.employment_type && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-ds-text-muted" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-ds-text-muted">Employment</p>
                        <p className="text-sm font-medium text-ds-text-primary">{formatEmploymentType(applicant.employment_type)}</p>
                      </div>
                    </div>
                  )}
                  {applicant.company && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-ds-text-muted" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-ds-text-muted">Company</p>
                        <p className="text-sm font-medium text-ds-text-primary">{applicant.company}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary stats */}
        <div className="rounded-lg border border-ds-border-default overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {data.combined_income && (
                <tr className="border-b border-ds-border-default">
                  <td className="px-4 py-3 text-ds-text-secondary">
                    <div className="flex items-center gap-2">
                      <PoundSterling className="h-3.5 w-3.5" />
                      Combined Income
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-ds-text-primary">{data.combined_income}</td>
                </tr>
              )}
              {data.estimated_deposit && (
                <tr className="border-b border-ds-border-default bg-ds-bg-tertiary">
                  <td className="px-4 py-3 text-ds-text-secondary">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Estimated Deposit
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-ds-text-primary">{data.estimated_deposit}</td>
                </tr>
              )}
              {data.credit_scores && (
                <tr className="border-b border-ds-border-default">
                  <td className="px-4 py-3 text-ds-text-secondary">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5" />
                      Credit Score
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-ds-text-primary">{data.credit_scores}</td>
                </tr>
              )}
              {hasBorrowingEstimate && (
                <tr className="bg-ds-accent-primary/5">
                  <td className="px-4 py-3 text-ds-text-secondary">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-ds-text-accent" />
                      <span className="font-medium text-ds-text-accent">Estimated Borrowing</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-ds-text-accent">
                    {data.borrowing_estimate_4x} — {data.borrowing_estimate_45x}
                    <span className="block text-[10px] font-normal text-ds-text-muted mt-0.5">4.0x — 4.5x income</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
