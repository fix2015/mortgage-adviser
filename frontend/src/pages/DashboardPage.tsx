import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, FileText, Download, Home, Upload, ArrowRight, CreditCard, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDocuments } from "@/hooks/useDocuments";
import { KnowledgeGraph } from "@/components/knowledge/KnowledgeGraph";
import { KnowledgePanel } from "@/components/knowledge/KnowledgePanel";
import { ProgressTracker } from "@/components/dashboard/ProgressTracker";
import { ReadinessScore } from "@/components/dashboard/ReadinessScore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { QuestionCounter } from "@/components/chat/QuestionCounter";
import { Spinner } from "@/components/ui/Spinner";
import { getActiveConsultation, verifyPayment } from "@/api/payments";
import { getStrategies } from "@/api/chat";
import type { KnowledgeNode, ConsultationInfo } from "@/types";

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
          <Button variant="glow" size="xl" rightIcon={<ArrowRight className="h-5 w-5" />}>Pay £15 to Get Started</Button>
          <p className="mt-4 text-xs text-ds-text-muted">Secure payment via Stripe.</p>
        </motion.div>
      </div>
    );
  }

  const questionsUsed = consultation.questions_used; const questionsLimit = consultation.questions_limit; const questionsLeft = questionsLimit - questionsUsed; const hasDocuments = documents.length > 0;

  if (!hasDocuments) {
    return (
      <div className="flex items-center justify-center h-full overflow-auto p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full text-center">
          {consultation.is_trial && <div className="mb-8 rounded-xl border border-ds-accent-secondary/30 bg-ds-accent-secondary/5 px-4 py-3 text-sm text-ds-text-secondary"><Sparkles className="inline h-4 w-4 text-ds-accent-secondary mr-1.5 -mt-0.5" />Free trial — {questionsLimit} questions & 1 document upload. <Link to="/dashboard" className="text-ds-text-accent hover:underline font-medium">Upgrade for £15</Link></div>}
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20 mx-auto mb-8"><Upload className="h-10 w-10 text-ds-text-accent" /></div>
          <h1 className="text-3xl font-bold text-ds-text-primary mb-4">Welcome, {user?.full_name?.split(" ")[0] || "there"}!</h1>
          <h2 className="text-xl text-ds-text-secondary mb-3">Upload your documents to get started</h2>
          <p className="text-sm text-ds-text-muted max-w-lg mx-auto mb-8 leading-relaxed">Our AI analyses your payslips, bank statements, and ID to assess affordability and match you with the best lenders.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
            <Card className="hover:border-ds-border-strong transition-colors"><FileText className="h-5 w-5 text-ds-text-accent mb-2" /><h3 className="text-sm font-semibold text-ds-text-primary mb-1">Payslips</h3><p className="text-xs text-ds-text-muted leading-relaxed">Last 3 months payslips to verify income</p></Card>
            <Card className="hover:border-ds-border-strong transition-colors"><FileText className="h-5 w-5 text-ds-feedback-success mb-2" /><h3 className="text-sm font-semibold text-ds-text-primary mb-1">Bank Statements</h3><p className="text-xs text-ds-text-muted leading-relaxed">Last 3 months to show spending habits</p></Card>
            <Card className="hover:border-ds-border-strong transition-colors"><FileText className="h-5 w-5 text-ds-accent-secondary mb-2" /><h3 className="text-sm font-semibold text-ds-text-primary mb-1">ID Documents</h3><p className="text-xs text-ds-text-muted leading-relaxed">Passport, driving licence, or proof of address</p></Card>
          </div>
          <Link to="/dashboard/documents"><Button variant="glow" size="xl" rightIcon={<ArrowRight className="h-5 w-5" />}>Upload Your Documents</Button></Link>
          <p className="mt-6 text-xs text-ds-text-muted">Supported: PDF, DOC, DOCX, TXT. All files encrypted.</p>
        </motion.div>
      </div>
    );
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
