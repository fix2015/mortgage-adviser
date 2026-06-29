import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, FileText, MessageSquare, Sparkles, Calendar, FileBarChart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { getStrategies, generateStrategy, downloadStrategy } from "@/api/chat";
import type { StrategyResponse } from "@/types";

export function StrategyDownload() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [strategies, setStrategies] = useState<StrategyResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStrategies = async () => { try { const data = await getStrategies(); setStrategies(data.strategies); setTotal(data.total); } catch { /* ignored */ } finally { setIsLoading(false); } };
  useEffect(() => { fetchStrategies(); }, []);

  const handleGenerate = async () => {
    setIsGenerating(true); setError("");
    try { await generateStrategy(`Mortgage Strategy - ${user?.full_name || "Client"}`); await fetchStrategies(); } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) { const ae = err as { response?: { status?: number } }; setError(ae.response?.status === 403 ? "PDF reports not available on free trial. Upgrade for £15." : "Failed to generate report. Chat first."); } else setError("Failed to generate report.");
    } finally { setIsGenerating(false); }
  };

  const handleDownload = async (strategy: StrategyResponse) => {
    setIsDownloading(strategy.id);
    try { const blob = await downloadStrategy(strategy.id); const b = new Blob([blob], { type: "application/pdf" }); const link = document.createElement("a"); link.href = URL.createObjectURL(b); link.download = `mortgage_strategy_${strategy.id}.pdf`; link.click(); URL.revokeObjectURL(link.href); } catch { setError("Failed to download report."); } finally { setIsDownloading(null); }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20 mx-auto mb-6"><FileText className="h-8 w-8 text-ds-text-accent" /></div>
          <h2 className="text-xl font-bold text-ds-text-primary mb-2">Generate Your Mortgage Strategy Report</h2>
          <p className="text-sm text-ds-text-secondary max-w-md mx-auto mb-6 leading-relaxed">Download a professional PDF with lender recommendations, affordability analysis, and next steps.</p>
          {error && <div className="mb-6 rounded-xl border border-ds-feedback-error/30 bg-ds-feedback-error/10 px-4 py-3 text-sm text-ds-feedback-error max-w-md mx-auto">{error}</div>}
          <Button variant="glow" size="lg" leftIcon={<Download className="h-5 w-5" />} onClick={handleGenerate} isLoading={isGenerating}>{isGenerating ? "Generating PDF..." : "Generate New Strategy PDF"}</Button>
          <p className="mt-4 text-xs text-ds-text-muted">Report includes all AI advice from your chat sessions</p>
        </Card>
      </motion.div>

      {!isLoading && strategies.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-ds-text-primary">Previous Reports</h3><span className="text-xs text-ds-text-muted">{total} report{total !== 1 ? "s" : ""}</span></div>
          <div className="space-y-3">{strategies.map((s) => (
            <Card key={s.id} className="hover:border-ds-border-strong transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ds-accent-primary/10 to-ds-accent-secondary/10 border border-ds-accent-primary/10 shrink-0"><FileBarChart className="h-5 w-5 text-ds-text-accent" /></div>
                  <div className="min-w-0 flex-1"><h4 className="text-sm font-semibold text-ds-text-primary truncate">{s.title}</h4><div className="flex items-center gap-3 mt-1 text-xs text-ds-text-muted"><span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(s.created_at).toLocaleDateString("en-GB")}</span></div>{s.summary && <p className="mt-2 text-xs text-ds-text-secondary leading-relaxed line-clamp-2">{s.summary}</p>}</div>
                </div>
                <Button variant="secondary" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => handleDownload(s)} isLoading={isDownloading === s.id}>Download PDF</Button>
              </div>
            </Card>
          ))}</div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="hover:border-ds-border-strong transition-colors"><div className="flex items-start gap-3"><MessageSquare className="h-5 w-5 text-ds-feedback-success shrink-0 mt-0.5" /><div><h3 className="text-sm font-semibold text-ds-text-primary mb-1">Chat first for better reports</h3><p className="text-xs text-ds-text-muted leading-relaxed">The more questions you ask, the more personalised your strategy.</p><Link to="/dashboard/chat" className="text-xs text-ds-text-accent hover:underline mt-2 inline-block">Go to Chat</Link></div></div></Card>
        <Card className="hover:border-ds-border-strong transition-colors"><div className="flex items-start gap-3"><Sparkles className="h-5 w-5 text-ds-text-accent shrink-0 mt-0.5" /><div><h3 className="text-sm font-semibold text-ds-text-primary mb-1">Share with your broker</h3><p className="text-xs text-ds-text-muted leading-relaxed">The PDF is designed to share with a qualified mortgage broker for implementation.</p></div></div></Card>
      </div>
    </div>
  );
}
