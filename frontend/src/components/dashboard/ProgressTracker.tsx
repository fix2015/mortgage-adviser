import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, Upload, Brain, MessageSquare, Download } from "lucide-react";
import { cn } from "@/utils/cn";

interface ProgressTrackerProps { documentsCount: number; hasProcessedDocument: boolean; questionsUsed: number; questionsLimit: number; hasDownloadedReport: boolean; }
interface StepConfig { label: string; icon: React.ElementType; completed: boolean; detail?: string; link: string; }

export function ProgressTracker({ documentsCount, hasProcessedDocument, questionsUsed, questionsLimit, hasDownloadedReport }: ProgressTrackerProps) {
  const navigate = useNavigate();
  const steps: StepConfig[] = [
    { label: "Upload Documents", icon: Upload, completed: documentsCount > 0, detail: documentsCount > 0 ? `${documentsCount} uploaded` : "No documents yet", link: "/dashboard/documents" },
    { label: "AI Analysis", icon: Brain, completed: hasProcessedDocument, detail: hasProcessedDocument ? "Analysis complete" : "Pending upload", link: "/dashboard/documents" },
    { label: "Ask Questions", icon: MessageSquare, completed: questionsUsed > 0, detail: `${questionsUsed}/${questionsLimit} questions`, link: "/dashboard/chat" },
    { label: "Get Strategy", icon: Download, completed: hasDownloadedReport, detail: hasDownloadedReport ? "Report ready" : "Available", link: "/dashboard/strategy" },
  ];
  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const currentIndex = steps.findIndex((s) => !s.completed);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-ds-border-default bg-ds-bg-tertiary p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-ds-text-primary">Consultation Progress</h3>
        <span className="text-xs font-medium text-ds-text-accent">{progressPercent}% complete</span>
      </div>
      <div className="flex items-start justify-between">
        {steps.map((step, i) => { const Icon = step.icon; const isCompleted = step.completed; const isCurrent = i === currentIndex; return (
          <div key={i} className="flex flex-1 items-start">
            <div className="flex flex-col items-center text-center w-full cursor-pointer group" onClick={() => navigate(step.link)}>
              <div className="relative">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 group-hover:scale-110",
                  isCompleted ? "border-ds-feedback-success bg-ds-feedback-success/15" : isCurrent ? "border-ds-accent-primary bg-ds-accent-primary/10" : "border-ds-border-default bg-ds-bg-surface group-hover:border-ds-border-accent")}>
                  {isCompleted ? <Check className="h-4 w-4 text-ds-feedback-success" /> : <Icon className={cn("h-4 w-4", isCurrent ? "text-ds-text-accent" : "text-ds-text-muted")} />}
                </div>
                {isCurrent && <motion.div className="absolute inset-0 rounded-full border-2 border-ds-accent-primary" animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />}
              </div>
              <p className={cn("mt-2 text-xs font-medium", isCompleted ? "text-ds-feedback-success" : isCurrent ? "text-ds-text-primary" : "text-ds-text-muted")}>{step.label}</p>
              <p className="mt-0.5 text-[10px] text-ds-text-muted">{step.detail}</p>
            </div>
            {i < steps.length - 1 && <div className="flex items-center h-10 w-full max-w-[60px] px-1"><div className={cn("h-0.5 w-full rounded-full transition-colors duration-300", isCompleted ? "bg-ds-feedback-success" : "bg-ds-border-default")} /></div>}
          </div>
        ); })}
      </div>
    </motion.div>
  );
}
