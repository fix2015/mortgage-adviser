import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, MessageSquare, PoundSterling, Percent, Building2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { compareBanks } from "@/api/chat";
import { useAuth } from "@/hooks/useAuth";
import type { BankSuggestion } from "@/types";

const CACHE_KEY = "bank_suggestions_cache";
const CACHE_TTL = 3600000; // 1 hour

const BADGES: Record<number, string> = {
  0: "Best Overall",
  1: "Lowest Rate",
  2: "Best Value",
  3: "Most Flexible",
  4: "Best for Your Profile",
};

function formatPence(pence: number): string {
  const pounds = pence / 100;
  if (pounds >= 1000) {
    return `£${(pounds / 1000).toFixed(pounds % 1000 === 0 ? 0 : 1)}k`;
  }
  return `£${pounds.toLocaleString("en-GB")}`;
}

function formatPounds(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-ds-border-default p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-lg bg-ds-bg-surface" />
        <div className="space-y-1.5">
          <div className="h-4 w-28 rounded bg-ds-bg-surface" />
          <div className="h-3 w-20 rounded bg-ds-bg-surface" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-ds-bg-surface" />
        <div className="h-3 w-3/4 rounded bg-ds-bg-surface" />
      </div>
    </div>
  );
}

export function BankSuggestions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<BankSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    // Try cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setSuggestions(data);
          setLoading(false);
          return;
        }
      }
    } catch { /* ignored */ }

    setLoading(true);
    try {
      const propertyValue = user?.property_value || 300000;
      const depositFraction = 0.1;
      const deposit = Math.round(propertyValue * depositFraction);
      const incomeRange = user?.income_range;
      let annualIncome = 50000;
      if (incomeRange) {
        const match = incomeRange.match(/(\d[\d,]*)/);
        if (match) annualIncome = parseInt(match[1].replace(/,/g, ""), 10);
      }

      const result = await compareBanks({
        property_value: propertyValue,
        deposit: deposit,
        annual_income: annualIncome,
        employment_type: user?.employment_type || "employed",
        term_years: 25,
        first_time_buyer: user?.buyer_type === "first_time" || true,
      });

      const recs = result.recommendations.slice(0, 5);
      setSuggestions(recs);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: recs, timestamp: Date.now() }));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchSuggestions(); }, [fetchSuggestions]);

  const handleAskAboutBank = (bankName: string) => {
    const question = `Tell me more about getting a mortgage with ${bankName}. What are their current rates, criteria, and how do they fit my situation?`;
    localStorage.setItem("chat_prefill_message", question);
    navigate("/dashboard/chat");
  };

  if (error) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card variant="glass" className="relative overflow-hidden">
        {/* Congratulations banner */}
        <div className="flex items-center gap-3 mb-6 rounded-xl p-4" style={{ background: "linear-gradient(135deg, rgba(5,150,105,0.1) 0%, rgba(217,119,6,0.08) 100%)", border: "1px solid rgba(5,150,105,0.2)" }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}>
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ds-text-primary flex items-center gap-2">
              You're Mortgage Ready!
              <Sparkles className="h-4 w-4 text-ds-accent-secondary" />
            </h3>
            <p className="text-xs text-ds-text-secondary mt-0.5">
              Based on your documents, here are lenders that match your profile
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((bank, idx) => (
                <motion.div
                  key={bank.lender_name + idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-xl border border-ds-border-default bg-white hover:border-ds-accent-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => handleAskAboutBank(bank.lender_name)}
                >
                  <div className="p-4">
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ds-accent-primary/10">
                          <Building2 className="h-4 w-4 text-ds-text-accent" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-ds-text-primary">{bank.lender_name}</h4>
                          <p className="text-[10px] text-ds-text-muted">{bank.product_type}</p>
                        </div>
                      </div>
                      {BADGES[idx] && (
                        <span className="text-[9px] font-semibold px-2 py-1 rounded-full" style={{
                          backgroundColor: idx === 0 ? "#dcfce7" : "#f0f9ff",
                          color: idx === 0 ? "#166534" : "#1e40af",
                          border: `1px solid ${idx === 0 ? "#bbf7d0" : "#bfdbfe"}`,
                        }}>
                          {BADGES[idx]}
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Percent className="h-3 w-3 text-ds-text-muted" />
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-ds-text-muted">Rate</p>
                          <p className="text-sm font-bold text-ds-text-primary">{bank.interest_rate}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <PoundSterling className="h-3 w-3 text-ds-text-muted" />
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-ds-text-muted">Monthly</p>
                          <p className="text-sm font-bold text-ds-text-primary">{formatPounds(bank.monthly_payment)}/mo</p>
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    {bank.reason && (
                      <p className="text-[11px] text-ds-text-secondary leading-relaxed line-clamp-2 mb-3">{bank.reason}</p>
                    )}

                    {/* Fees and total */}
                    <div className="flex items-center justify-between text-[10px] text-ds-text-muted border-t border-ds-border-default pt-2 mb-3">
                      <span>Fees: {formatPounds(bank.fees)}</span>
                      <span>Total: {formatPence(bank.total_cost)}</span>
                    </div>

                    {/* CTA */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-1.5 text-xs group-hover:bg-ds-accent-primary/10 group-hover:text-ds-text-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAskAboutBank(bank.lender_name);
                      }}
                    >
                      <MessageSquare className="h-3 w-3" />
                      Ask AI about this
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            <p className="text-[10px] text-ds-text-muted mt-4 text-center">
              Rates are illustrative based on current market data. Always verify with lenders directly.
            </p>
          </>
        )}
      </Card>
    </motion.div>
  );
}
