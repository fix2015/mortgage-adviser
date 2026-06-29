import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, AlertTriangle, XCircle, ChevronDown, ChevronUp, MessageSquare, Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getLenderPredictions } from "@/api/chat";
import type { LenderPrediction } from "@/types";

const CACHE_KEY = "lender_predictions_cache";
const CACHE_TTL = 3600000; // 1 hour

function verdictColor(verdict: string) {
  switch (verdict) {
    case "LIKELY":
      return { bg: "#dcfce7", text: "#166534", border: "#bbf7d0", bar: "#22c55e" };
    case "POSSIBLE":
      return { bg: "#fef3c7", text: "#92400e", border: "#fde68a", bar: "#f59e0b" };
    case "UNLIKELY":
      return { bg: "#fee2e2", text: "#991b1b", border: "#fecaca", bar: "#ef4444" };
    default:
      return { bg: "#f3f4f6", text: "#6b7280", border: "#e5e7eb", bar: "#9ca3af" };
  }
}

function VerdictIcon({ verdict }: { verdict: string }) {
  switch (verdict) {
    case "LIKELY":
      return <ShieldCheck className="h-4 w-4" />;
    case "POSSIBLE":
      return <AlertTriangle className="h-4 w-4" />;
    case "UNLIKELY":
      return <XCircle className="h-4 w-4" />;
    default:
      return null;
  }
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-ds-border-default p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-ds-bg-surface" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-28 rounded bg-ds-bg-surface" />
          <div className="h-3 w-20 rounded bg-ds-bg-surface" />
        </div>
        <div className="h-8 w-16 rounded bg-ds-bg-surface" />
      </div>
      <div className="h-2 w-full rounded-full bg-ds-bg-surface mb-3" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-ds-bg-surface" />
        <div className="h-3 w-3/4 rounded bg-ds-bg-surface" />
      </div>
    </div>
  );
}

function PredictionCard({ prediction, index }: { prediction: LenderPrediction; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const colors = verdictColor(prediction.verdict);

  const handleAskAI = () => {
    const question = `What are my chances of getting approved with ${prediction.lender}? What can I do to improve my application for them?`;
    localStorage.setItem("chat_prefill_message", question);
    navigate("/dashboard/chat");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <div className="rounded-xl border border-ds-border-default bg-white hover:border-ds-border-strong transition-all duration-200">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ds-accent-primary/10">
                <Building2 className="h-5 w-5 text-ds-text-accent" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ds-text-primary">{prediction.lender}</h4>
                <p className="text-xs text-ds-text-muted">{prediction.reason.slice(0, 60)}{prediction.reason.length > 60 ? "..." : ""}</p>
              </div>
            </div>
            <span
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md"
              style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
            >
              <VerdictIcon verdict={prediction.verdict} />
              {prediction.verdict}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-ds-text-muted">Approval likelihood</span>
              <span className="text-sm font-bold" style={{ color: colors.text }}>{prediction.prediction}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-ds-bg-surface overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: colors.bar }}
                initial={{ width: 0 }}
                animate={{ width: `${prediction.prediction}%` }}
                transition={{ duration: 0.8, delay: index * 0.08 + 0.3 }}
              />
            </div>
          </div>

          {/* Reason */}
          <p className="text-xs text-ds-text-secondary leading-relaxed mb-3">{prediction.reason}</p>

          {/* Expand/collapse */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-ds-text-accent hover:text-ds-accent-primary transition-colors mb-2"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Hide details" : "Show strengths & risks"}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {prediction.strengths.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: "#059669" }}>Strengths</p>
                    <ul className="space-y-1">
                      {prediction.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-ds-text-secondary">
                          <ShieldCheck className="h-3 w-3 mt-0.5 shrink-0" style={{ color: "#059669" }} />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {prediction.risk_factors.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: "#dc2626" }}>Risk Factors</p>
                    <ul className="space-y-1">
                      {prediction.risk_factors.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-ds-text-secondary">
                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" style={{ color: "#dc2626" }} />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-1.5 text-xs"
            onClick={handleAskAI}
          >
            <MessageSquare className="h-3 w-3" />
            Ask AI about {prediction.lender}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function LenderPredictor() {
  const [predictions, setPredictions] = useState<LenderPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchPredictions = useCallback(async () => {
    // Try cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setPredictions(data);
          setLoading(false);
          return;
        }
      }
    } catch { /* ignored */ }

    setLoading(true);
    try {
      const result = await getLenderPredictions();
      setPredictions(result.predictions);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result.predictions, timestamp: Date.now() }));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPredictions(); }, [fetchPredictions]);

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-ds-text-muted mx-auto mb-3" />
          <p className="text-sm text-ds-text-secondary">Unable to load lender predictions. Please try again later.</p>
          <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setError(false); fetchPredictions(); }}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ds-text-primary">Lender Decision Predictions</h2>
          <p className="text-xs text-ds-text-muted mt-0.5">AI-powered approval likelihood based on your documents</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predictions.map((p, i) => (
              <PredictionCard key={p.lender} prediction={p} index={i} />
            ))}
          </div>
          <p className="text-[10px] text-ds-text-muted text-center">
            Predictions are AI-generated estimates based on your documents and typical lender criteria. Always verify with lenders directly.
          </p>
        </>
      )}
    </div>
  );
}
