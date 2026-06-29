import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Users, Building2, Key, ChevronRight, ChevronLeft, Upload, MessageSquare, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/documents/FileUpload";
import { useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { updateBuyerInfo } from "@/api/auth";
import { cn } from "@/utils/cn";

interface OnboardingWizardProps { onComplete: () => void; }

const BUYER_TYPES = [
  { value: "first_time", label: "First-Time Buyer", icon: Key, desc: "Buying your first home" },
  { value: "moving_home", label: "Moving Home", icon: Home, desc: "Selling and buying a new property" },
  { value: "remortgage", label: "Remortgaging", icon: Building2, desc: "Switching your existing mortgage" },
  { value: "buy_to_let", label: "Buy-to-Let", icon: Users, desc: "Purchasing as an investment" },
];

const INCOME_RANGES = [
  { value: "0-25k", label: "Under £25k" }, { value: "25k-40k", label: "£25k - £40k" },
  { value: "40k-60k", label: "£40k - £60k" }, { value: "60k-100k", label: "£60k - £100k" },
  { value: "100k-150k", label: "£100k - £150k" }, { value: "150k+", label: "£150k+" },
];

const QUESTIONS: Record<string, { text: string; question: string }[]> = {
  first_time: [
    { text: "How much can I borrow?", question: "How much can I borrow as a first-time buyer?" },
    { text: "What deposit do I need?", question: "What deposit do I need for my first home?" },
    { text: "Help to Buy options", question: "What Help to Buy schemes are available to me?" },
    { text: "Best rates for FTB", question: "What are the best mortgage rates for first-time buyers right now?" },
  ],
  moving_home: [
    { text: "Porting my mortgage", question: "Can I port my existing mortgage to a new property?" },
    { text: "Stamp duty calculator", question: "How much stamp duty will I pay on my new property?" },
    { text: "Chain management tips", question: "How do I manage a property chain effectively?" },
    { text: "Remortgage vs port", question: "Should I remortgage or port when moving home?" },
  ],
  remortgage: [
    { text: "When to remortgage", question: "When is the best time to remortgage?" },
    { text: "Early repayment charges", question: "Will I have to pay early repayment charges?" },
    { text: "Best remortgage deals", question: "What are the best remortgage deals available now?" },
    { text: "Release equity", question: "Can I release equity when I remortgage?" },
  ],
  buy_to_let: [
    { text: "BTL mortgage criteria", question: "What are the criteria for a buy-to-let mortgage?" },
    { text: "Rental yield needed", question: "What rental yield do I need for a BTL mortgage?" },
    { text: "Tax on rental income", question: "How is rental income taxed for buy-to-let properties?" },
    { text: "Limited company BTL", question: "Should I buy through a limited company for buy-to-let?" },
  ],
};

const stepVariants = { enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d: number) => ({ x: d < 0 ? 300 : -300, opacity: 0 }) };

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { upload, isUploading } = useDocuments();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [buyerType, setBuyerType] = useState("");
  const [incomeRange, setIncomeRange] = useState("");
  const [propertyValue, setPropertyValue] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(false);

  const totalSteps = 3;
  const progress = ((step + 1) / totalSteps) * 100;
  const goNext = () => { setDirection(1); setStep((s) => Math.min(s + 1, totalSteps - 1)); };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };

  const handleSaveBuyerInfo = async () => {
    setIsSaving(true);
    try { await updateBuyerInfo({ buyer_type: buyerType || undefined, income_range: incomeRange || undefined, property_value: propertyValue || undefined }); await refreshUser(); goNext(); } catch { goNext(); } finally { setIsSaving(false); }
  };

  const handleUpload = async (file: File) => { await upload(file); setUploadedFile(true); };
  const completeOnboarding = async () => {
    try { await updateBuyerInfo({}); await refreshUser(); } catch { /* ignored */ }
    onComplete();
  };
  const handleQuestionClick = async (question: string) => { await completeOnboarding(); navigate(`/dashboard/chat?q=${encodeURIComponent(question)}`); };
  const questions = QUESTIONS[buyerType] || QUESTIONS["first_time"];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto rounded-2xl bg-ds-bg-secondary border border-ds-border-default shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-ds-bg-surface rounded-t-2xl overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-ds-accent-primary to-ds-accent-secondary" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} /></div>
        <div className="flex items-center justify-center gap-3 pt-8 pb-2">{Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center gap-3"><div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300", i < step ? "bg-ds-feedback-success text-white" : i === step ? "bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary text-white shadow-lg shadow-ds-accent-primary/30" : "bg-ds-bg-surface text-ds-text-muted border border-ds-border-default")}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</div>{i < totalSteps - 1 && <div className={cn("h-0.5 w-12 rounded-full transition-colors duration-300", i < step ? "bg-ds-feedback-success" : "bg-ds-border-default")} />}</div>
        ))}</div>

        <div className="px-8 pb-8 pt-4 overflow-hidden">
          <AnimatePresence custom={direction} mode="wait">
            {step === 0 && (
              <motion.div key="step-0" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="text-center mb-6"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20 mx-auto mb-4"><Sparkles className="h-7 w-7 text-ds-text-accent" /></div><h2 className="text-xl font-bold text-ds-text-primary">Tell us about your situation</h2><p className="text-sm text-ds-text-secondary mt-1">This helps us tailor our mortgage advice</p></div>
                <div className="grid grid-cols-2 gap-3 mb-6">{BUYER_TYPES.map((bt) => (<button key={bt.value} onClick={() => setBuyerType(bt.value)} className={cn("flex flex-col items-start gap-2 rounded-xl p-4 border text-left transition-all duration-200 cursor-pointer", buyerType === bt.value ? "border-ds-accent-primary bg-ds-accent-primary/10 shadow-md shadow-ds-accent-primary/10" : "border-ds-border-default bg-ds-bg-tertiary hover:border-ds-border-strong hover:bg-ds-bg-surface")}><bt.icon className={cn("h-5 w-5", buyerType === bt.value ? "text-ds-text-accent" : "text-ds-text-muted")} /><div><p className="text-sm font-semibold text-ds-text-primary">{bt.label}</p><p className="text-xs text-ds-text-muted mt-0.5">{bt.desc}</p></div></button>))}</div>
                <div className="mb-5"><label className="block text-sm font-medium text-ds-text-primary mb-2">Household Income</label><select value={incomeRange} onChange={(e) => setIncomeRange(e.target.value)} className="w-full rounded-lg border border-ds-border-default bg-ds-bg-tertiary px-4 py-2.5 text-sm text-ds-text-primary focus:border-ds-accent-primary focus:outline-none appearance-none cursor-pointer"><option value="">Select income range</option>{INCOME_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
                <div className="mb-8"><label className="block text-sm font-medium text-ds-text-primary mb-2">Target Property Value</label><input type="number" min={0} value={propertyValue || ""} onChange={(e) => setPropertyValue(parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-ds-border-default bg-ds-bg-tertiary px-4 py-2.5 text-sm text-ds-text-primary focus:border-ds-accent-primary focus:outline-none" placeholder="e.g. 300000" /></div>
                <Button variant="glow" size="lg" className="w-full" onClick={handleSaveBuyerInfo} isLoading={isSaving} disabled={!buyerType} rightIcon={<ChevronRight className="h-4 w-4" />}>Continue</Button>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="step-1" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="text-center mb-6"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20 mx-auto mb-4"><Upload className="h-7 w-7 text-ds-text-accent" /></div><h2 className="text-xl font-bold text-ds-text-primary">Upload your first document</h2><p className="text-sm text-ds-text-secondary mt-1">Payslips, bank statements, or ID for our AI to analyse</p></div>
                <div className="mb-6"><FileUpload onUpload={handleUpload} isUploading={isUploading} /></div>
                {uploadedFile && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-center gap-2 rounded-lg bg-ds-feedback-success/10 border border-ds-feedback-success/20 px-4 py-3"><Check className="h-4 w-4 text-ds-feedback-success" /><p className="text-sm text-ds-text-primary">Document uploaded!</p></motion.div>}
                <div className="flex gap-3"><Button variant="secondary" size="lg" className="flex-1" onClick={goBack} leftIcon={<ChevronLeft className="h-4 w-4" />}>Back</Button><Button variant={uploadedFile ? "glow" : "ghost"} size="lg" className="flex-1" onClick={goNext} rightIcon={<ChevronRight className="h-4 w-4" />}>{uploadedFile ? "Continue" : "Skip for now"}</Button></div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step-2" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                <div className="text-center mb-6"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20 mx-auto mb-4"><MessageSquare className="h-7 w-7 text-ds-text-accent" /></div><h2 className="text-xl font-bold text-ds-text-primary">Ask your first question</h2><p className="text-sm text-ds-text-secondary mt-1">Choose a question or explore on your own</p></div>
                <div className="grid grid-cols-1 gap-2.5 mb-6">{questions.map((q, i) => (<motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} onClick={() => handleQuestionClick(q.question)} className="flex items-center gap-3 rounded-xl border border-ds-border-default bg-ds-bg-tertiary p-4 text-left transition-all duration-200 hover:border-ds-accent-primary/40 hover:bg-ds-accent-primary/5 cursor-pointer group"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ds-accent-primary/10 group-hover:bg-ds-accent-primary/20 transition-colors"><MessageSquare className="h-4 w-4 text-ds-text-accent" /></div><span className="text-sm text-ds-text-primary font-medium">{q.text}</span><ChevronRight className="h-4 w-4 text-ds-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" /></motion.button>))}</div>
                <div className="flex gap-3"><Button variant="secondary" size="lg" className="flex-1" onClick={goBack} leftIcon={<ChevronLeft className="h-4 w-4" />}>Back</Button><Button variant="ghost" size="lg" className="flex-1" onClick={completeOnboarding}>I'll explore on my own</Button></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
