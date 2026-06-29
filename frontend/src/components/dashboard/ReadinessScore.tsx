import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, animate, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw, TrendingUp, ShieldCheck, Wallet, Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getReadinessScore } from "@/api/chat";
import type { ReadinessScoreResponse } from "@/types";

function getScoreColor(s: number) { return s >= 70 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444"; }
function getScoreLabel(s: number) { return s >= 70 ? "Mortgage Ready" : s >= 40 ? "Nearly There" : "Needs Work"; }
function getScoreGradient(s: number): [string, string] { return s >= 70 ? ["#22c55e", "#10b981"] : s >= 40 ? ["#f59e0b", "#d97706"] : ["#ef4444", "#dc2626"]; }
function getScoreBgClass(s: number) { return s >= 70 ? "text-green-400" : s >= 40 ? "text-amber-400" : "text-red-400"; }

function AnimatedNumber({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);
  useEffect(() => { const c = animate(mv, value, { duration, ease: "easeOut" }); const u = rounded.on("change", (v) => setDisplay(v)); return () => { c.stop(); u(); }; }, [value, duration, mv, rounded]);
  return <>{display}</>;
}

function CircularGauge({ score }: { score: number }) {
  const size = 180; const sw = 12; const r = (size - sw) / 2; const c = 2 * Math.PI * r;
  const [g1, g2] = getScoreGradient(score);
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs><linearGradient id="readiness-gauge" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={g1} /><stop offset="100%" stopColor={g2} /></linearGradient></defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" className="text-white/5" strokeWidth={sw} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#readiness-gauge)" strokeWidth={sw} strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (score / 100) * c }} transition={{ duration: 1.4, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-ds-text-primary leading-none"><AnimatedNumber value={score} duration={1.4} />%</span>
        <span className={cn("text-xs font-semibold mt-1.5", getScoreBgClass(score))}>{getScoreLabel(score)}</span>
      </div>
    </div>
  );
}

function MetricBar({ label, value, icon: Icon, delay = 0 }: { label: string; value: number; icon: React.ElementType; delay?: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-ds-text-muted" /><span className="text-xs font-medium text-ds-text-secondary">{label}</span></div><span className="text-xs font-bold text-ds-text-primary">{value}%</span></div>
      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden"><motion.div className="h-full rounded-full" style={{ backgroundColor: getScoreColor(value) }} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1, ease: "easeOut", delay }} /></div>
    </div>
  );
}

export function ReadinessScore() {
  const navigate = useNavigate();
  const [data, setData] = useState<ReadinessScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScore = useCallback(async (isRefresh = false) => {
    if (!isRefresh) { try { const c = localStorage.getItem("readiness_cache"); if (c) { const { data: d, timestamp } = JSON.parse(c); if (Date.now() - timestamp < 3600000) { setData(d); setLoading(false); return; } } } catch {} }
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try { const result = await getReadinessScore(); setData(result); localStorage.setItem("readiness_cache", JSON.stringify({ data: result, timestamp: Date.now() })); } catch { /* fail silently */ } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchScore(); }, [fetchScore]);

  if (loading) return <Card variant="glass"><div className="animate-pulse space-y-6"><div className="flex justify-center"><div className="h-[180px] w-[180px] rounded-full border-[12px] border-white/5" /></div></div></Card>;
  if (!data) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card variant="glass" className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full opacity-20 blur-3xl" style={{ background: `radial-gradient(circle, ${getScoreColor(data.overall)}, transparent)` }} />
        <div className="flex items-center justify-between mb-6">
          <div><h3 className="text-sm font-semibold text-ds-text-primary">Mortgage Readiness Score</h3><p className="text-[11px] text-ds-text-muted mt-0.5">AI-powered assessment</p></div>
          <Button variant="ghost" size="sm" onClick={() => fetchScore(true)} disabled={refreshing} className="gap-1.5"><RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />Refresh</Button>
        </div>
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <div className="shrink-0"><CircularGauge score={data.overall} /></div>
          <div className="flex-1 w-full space-y-5">
            <MetricBar label="Deposit Strength" value={data.deposit_strength} icon={Wallet} delay={0.2} />
            <MetricBar label="Income Stability" value={data.income_stability} icon={TrendingUp} delay={0.4} />
            <MetricBar label="Credit Readiness" value={data.credit_readiness} icon={ShieldCheck} delay={0.6} />
          </div>
        </div>
        {data.recommendations.length > 0 && (
          <div className="mt-6 pt-5 border-t border-ds-border-default">
            <div className="flex items-center gap-2 mb-3"><Lightbulb className="h-3.5 w-3.5 text-ds-accent-secondary" /><span className="text-xs font-semibold text-ds-text-secondary uppercase tracking-wider">AI Recommendations</span></div>
            <ul className="space-y-2">{data.recommendations.map((rec, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.15 }}
                onClick={() => navigate(`/dashboard/chat?q=${encodeURIComponent(`Give me detailed advice: ${rec}`)}`)}
                className="flex items-center gap-2.5 text-xs text-ds-text-secondary leading-relaxed cursor-pointer hover:text-ds-text-primary hover:bg-ds-bg-surface/50 rounded-lg px-2 py-1.5 -mx-2 transition-colors group">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ds-accent-primary/10 text-[10px] font-bold text-ds-text-accent">{i + 1}</span>
                <span className="flex-1">{rec}</span><ArrowRight className="h-3 w-3 text-ds-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </motion.li>
            ))}</ul>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
