import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HeartPulse, ArrowRight, TrendingDown, TrendingUp, Clock, PoundSterling, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { runHealthCheck } from "@/api/chat";
import type { HealthCheckResponse } from "@/types";

function formatGBP(amount: number): string {
  return `\u00A3${Math.round(amount).toLocaleString("en-GB")}`;
}

function ResultsDisplay({ result }: { result: HealthCheckResponse }) {
  const isSaving = result.monthly_saving > 0;
  const recColor = result.recommendation === "SWITCH"
    ? { bg: "#dcfce7", text: "#166534", border: "#bbf7d0" }
    : { bg: "#fef3c7", text: "#92400e", border: "#fde68a" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Recommendation badge */}
      <div className="text-center">
        <span
          className="inline-flex items-center gap-2 text-lg font-bold px-6 py-3 rounded-2xl"
          style={{ backgroundColor: recColor.bg, color: recColor.text, border: `2px solid ${recColor.border}` }}
        >
          {result.recommendation === "SWITCH" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Clock className="h-5 w-5" />
          )}
          Recommendation: {result.recommendation === "SWITCH" ? "Switch Now" : "Wait for Now"}
        </span>
      </div>

      {/* Big savings display */}
      {isSaving && (
        <Card variant="glow" className="text-center py-8">
          <TrendingDown className="h-10 w-10 mx-auto mb-3" style={{ color: "#059669" }} />
          <p className="text-sm text-ds-text-secondary mb-1">You could save</p>
          <p className="text-4xl font-bold text-ds-text-primary mb-1">{formatGBP(result.monthly_saving)}<span className="text-lg font-normal text-ds-text-muted">/month</span></p>
          <p className="text-lg font-semibold" style={{ color: "#059669" }}>({formatGBP(result.annual_saving)}/year)</p>
        </Card>
      )}

      {!isSaving && (
        <Card className="text-center py-8">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3" style={{ color: "#059669" }} />
          <p className="text-lg font-bold text-ds-text-primary">Your current rate is competitive!</p>
          <p className="text-sm text-ds-text-secondary mt-1">The best available rate is {result.best_rate_available}%, which is close to or above your current {result.current_rate}%.</p>
        </Card>
      )}

      {/* Comparison chart */}
      <Card>
        <h3 className="text-sm font-bold text-ds-text-primary mb-4">Monthly Payment Comparison</h3>
        <div className="space-y-4">
          {/* Current */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-ds-text-secondary">Current ({result.current_lender} @ {result.current_rate}%)</span>
              <span className="text-sm font-bold text-ds-text-primary">{formatGBP(result.current_monthly)}/mo</span>
            </div>
            <div className="h-4 w-full rounded-full bg-ds-bg-surface overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: "#ef4444" }}
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
          {/* Best available */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-ds-text-secondary">Best available ({result.best_rate_available}% 2-year fixed)</span>
              <span className="text-sm font-bold" style={{ color: "#059669" }}>{formatGBP(result.best_available_monthly)}/mo</span>
            </div>
            <div className="h-4 w-full rounded-full bg-ds-bg-surface overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: "#22c55e" }}
                initial={{ width: 0 }}
                animate={{ width: `${(result.best_available_monthly / result.current_monthly) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Break-even analysis */}
      {isSaving && (
        <Card>
          <h3 className="text-sm font-bold text-ds-text-primary mb-4">Break-Even Analysis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-ds-bg-surface">
              <PoundSterling className="h-5 w-5 mx-auto mb-2 text-ds-text-muted" />
              <p className="text-[10px] uppercase tracking-wider text-ds-text-muted mb-1">Estimated Switch Cost</p>
              <p className="text-lg font-bold text-ds-text-primary">{formatGBP(result.switch_cost_estimate)}</p>
              <p className="text-[10px] text-ds-text-muted mt-0.5">ERC (2%) + arrangement fee</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-ds-bg-surface">
              <Clock className="h-5 w-5 mx-auto mb-2 text-ds-text-muted" />
              <p className="text-[10px] uppercase tracking-wider text-ds-text-muted mb-1">Break-Even Point</p>
              <p className="text-lg font-bold text-ds-text-primary">{Math.ceil(result.break_even_months)} months</p>
              <p className="text-[10px] text-ds-text-muted mt-0.5">Time to recoup switch costs</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-ds-bg-surface">
              <TrendingUp className="h-5 w-5 mx-auto mb-2" style={{ color: "#059669" }} />
              <p className="text-[10px] uppercase tracking-wider text-ds-text-muted mb-1">5-Year Saving</p>
              <p className="text-lg font-bold" style={{ color: "#059669" }}>{formatGBP(result.annual_saving * 5 - result.switch_cost_estimate)}</p>
              <p className="text-[10px] text-ds-text-muted mt-0.5">Net saving after costs</p>
            </div>
          </div>
        </Card>
      )}

      {/* CTA */}
      {result.recommendation === "SWITCH" && (
        <div className="text-center">
          <Link to="/dashboard/chat">
            <Button variant="glow" size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
              Start Your Remortgage Consultation
            </Button>
          </Link>
        </div>
      )}

      <p className="text-[10px] text-ds-text-muted text-center">
        Rates are illustrative (best 2-year fixed as of 2025). ERC is estimated at 2% of balance.
        Always check your actual ERC with {result.current_lender} before switching.
      </p>
    </motion.div>
  );
}

export function HealthCheckPage() {
  const [currentRate, setCurrentRate] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [remainingTerm, setRemainingTerm] = useState("");
  const [currentLender, setCurrentLender] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const rate = parseFloat(currentRate);
    const balance = parseInt(currentBalance.replace(/,/g, ""), 10);
    const term = parseInt(remainingTerm, 10);

    if (isNaN(rate) || rate <= 0 || rate > 20) {
      setError("Please enter a valid interest rate between 0% and 20%");
      return;
    }
    if (isNaN(balance) || balance <= 0) {
      setError("Please enter a valid mortgage balance");
      return;
    }
    if (isNaN(term) || term < 1 || term > 40) {
      setError("Please enter a remaining term between 1 and 40 years");
      return;
    }
    if (!currentLender.trim()) {
      setError("Please enter your current lender");
      return;
    }

    setLoading(true);
    try {
      const data = await runHealthCheck({
        current_rate: rate,
        current_balance: balance,
        remaining_term: term,
        current_lender: currentLender.trim(),
      });
      setResult(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr?.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 h-full overflow-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20">
          <HeartPulse className="h-6 w-6 text-ds-text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ds-text-primary">Mortgage Health Check</h1>
          <p className="text-sm text-ds-text-secondary mt-0.5">Find out if you could save by switching your mortgage</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Current Interest Rate (%)"
              type="number"
              step="0.01"
              min="0"
              max="20"
              placeholder="e.g. 5.49"
              value={currentRate}
              onChange={(e) => setCurrentRate(e.target.value)}
            />
            <Input
              label="Outstanding Balance (\u00A3)"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 200000"
              value={currentBalance}
              onChange={(e) => setCurrentBalance(e.target.value.replace(/[^0-9,]/g, ""))}
            />
            <Input
              label="Remaining Term (years)"
              type="number"
              min="1"
              max="40"
              placeholder="e.g. 22"
              value={remainingTerm}
              onChange={(e) => setRemainingTerm(e.target.value)}
            />
            <Input
              label="Current Lender"
              type="text"
              placeholder="e.g. Halifax"
              value={currentLender}
              onChange={(e) => setCurrentLender(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-ds-feedback-error/30 bg-ds-feedback-error/10 px-4 py-3 text-sm text-ds-feedback-error flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" variant="glow" size="lg" className="w-full" isLoading={loading}>
            {loading ? "Checking..." : "Check My Mortgage"}
          </Button>
        </form>
      </Card>

      <AnimatePresence>
        {result && <ResultsDisplay result={result} />}
      </AnimatePresence>
    </div>
  );
}
