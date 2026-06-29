import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChatMessage, StreamingMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { QuestionCounter } from "./QuestionCounter";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/Button";
import { Bot, Sparkles, Zap, CheckCircle, Home as HomeIcon, BarChart3, TrendingUp } from "lucide-react";
import { getActiveConsultation } from "@/api/payments";
import { getChatSuggestions, finishConsultation } from "@/api/chat";
import { useToast } from "@/components/ui/Toast";
import type { ConsultationInfo } from "@/types";

export function ChatWindow() {
  const { messages, isStreaming, streamingContent, error, sendMessage, stopStreaming, loadHistory } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [consultation, setConsultation] = useState<ConsultationInfo | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [activeAgent, setActiveAgent] = useState<"mortgage" | "affordability" | "property">("mortgage");
  const { toast } = useToast();

  const agentTabs = [
    { id: "mortgage" as const, label: "Mortgage Adviser", icon: HomeIcon, color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/30", activeBg: "bg-emerald-500/20" },
    { id: "affordability" as const, label: "Affordability", icon: BarChart3, color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30", activeBg: "bg-amber-500/20" },
    { id: "property" as const, label: "Property Expert", icon: TrendingUp, color: "text-teal-400", bg: "bg-teal-500/15", border: "border-teal-500/30", activeBg: "bg-teal-500/20" },
  ];

  const questionsUsed = consultation?.questions_used ?? 0;
  const questionsTotal = consultation?.questions_limit ?? 0;
  const isOutOfQuestions = questionsUsed >= questionsTotal;

  const loadSuggestions = () => { getChatSuggestions().then(setSuggestions).catch(() => setSuggestions([])); };

  const [searchParams, setSearchParams] = useSearchParams();
  const autoSentRef = useRef(false);

  useEffect(() => { loadHistory(); loadSuggestions(); getActiveConsultation().then(setConsultation).catch(() => setConsultation(null)); }, [loadHistory]);
  useEffect(() => { const q = searchParams.get("q"); if (q && !autoSentRef.current && !isStreaming) { autoSentRef.current = true; sendMessage(q, activeAgent); setSearchParams({}, { replace: true }); } }, [searchParams, isStreaming, sendMessage, activeAgent, setSearchParams]);

  const prevStreamingRef = useRef(false);
  useEffect(() => { if (prevStreamingRef.current && !isStreaming) { getActiveConsultation().then(setConsultation).catch(() => {}); loadSuggestions(); } prevStreamingRef.current = isStreaming; }, [isStreaming]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, streamingContent]);

  const handleSend = (content: string) => { sendMessage(content, activeAgent); };
  const handleFinish = async () => { if (isFinishing) return; setIsFinishing(true); try { const result = await finishConsultation(); toast("success", result.message); getActiveConsultation().then(setConsultation).catch(() => setConsultation(null)); } catch { toast("error", "Failed to finish consultation."); } finally { setIsFinishing(false); } };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ds-border-default px-6 py-3 bg-ds-bg-secondary/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary"><Bot className="h-5 w-5 text-white" /></div>
          <div><h2 className="text-sm font-semibold text-ds-text-primary">AI Mortgage Adviser</h2><p className="text-xs text-ds-feedback-success flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-ds-feedback-success inline-block" />Online</p></div>
        </div>
        <div className="flex items-center gap-3">
          <QuestionCounter used={questionsUsed} total={questionsTotal} className="w-48" />
          {messages.length > 0 && !isOutOfQuestions && (<Button variant="secondary" size="sm" onClick={handleFinish} disabled={isFinishing || isStreaming} className="flex items-center gap-1.5 text-xs"><CheckCircle className="h-3.5 w-3.5" />{isFinishing ? "Finishing..." : "Finish"}</Button>)}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-ds-border-default px-6 py-2 bg-ds-bg-secondary/30">
        {agentTabs.map((tab) => { const Icon = tab.icon; const isActive = activeAgent === tab.id; return (
          <button key={tab.id} onClick={() => setActiveAgent(tab.id)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 border ${isActive ? `${tab.activeBg} ${tab.color} ${tab.border}` : "border-transparent text-ds-text-muted hover:text-ds-text-secondary hover:bg-ds-bg-surface/50"}`}><Icon className="h-3.5 w-3.5" />{tab.label}</button>
        ); })}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto p-6 space-y-6">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20 mb-6"><Sparkles className="h-8 w-8 text-ds-text-accent" /></div>
            <h3 className="text-xl font-semibold text-ds-text-primary mb-2">Start Your Mortgage Consultation</h3>
            <p className="text-sm text-ds-text-secondary max-w-md mb-8">Ask me anything about UK mortgages, rates, affordability, or lender requirements.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {["How much can I borrow?", "What's the best rate for my LTV?", "Am I eligible for Help to Buy?", "Fixed vs variable rate - which is better?"].map((s) => (
                <button key={s} onClick={() => handleSend(s)} className="text-left text-xs text-ds-text-secondary rounded-xl border border-ds-border-default p-3 hover:border-ds-border-accent hover:text-ds-text-primary hover:bg-ds-bg-surface/50 transition-all duration-200">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => <ChatMessage key={msg.id} message={msg} onQuestionClick={handleSend} />)}
        {isStreaming && streamingContent && <StreamingMessage content={streamingContent} />}
        {error && <div className="mx-auto max-w-md rounded-xl border border-ds-feedback-error/30 bg-ds-feedback-error/10 p-4 text-center"><p className="text-sm text-ds-feedback-error">{error}</p></div>}
      </div>

      {isOutOfQuestions && (<div className="border-t border-ds-border-default bg-ds-bg-tertiary/80 px-6 py-4 text-center"><p className="text-sm text-ds-text-secondary mb-3">You have used all your questions. Purchase more to continue.</p><Link to="/dashboard"><Button variant="glow" size="md">Upgrade Consultation</Button></Link></div>)}

      {suggestions.length > 0 && !isOutOfQuestions && !isStreaming && (
        <div className="border-t border-ds-border-default bg-ds-bg-secondary/50 px-4 py-2">
          <div className="flex items-center gap-1.5 mb-1.5"><Zap className="h-3 w-3 text-ds-text-accent" /><span className="text-[10px] font-medium text-ds-text-muted uppercase tracking-wider">Quick questions</span></div>
          <div className="flex flex-wrap gap-1.5">{suggestions.map((s) => (<button key={s} onClick={() => handleSend(s)} className="text-[11px] text-ds-text-secondary rounded-lg border border-ds-border-default px-2.5 py-1.5 hover:border-ds-border-accent hover:text-ds-text-primary hover:bg-ds-bg-surface/50 transition-all duration-200 max-w-[280px] truncate">{s}</button>))}</div>
        </div>
      )}
      <ChatInput onSend={handleSend} onStop={stopStreaming} isStreaming={isStreaming} disabled={isOutOfQuestions} placeholder={isOutOfQuestions ? "Purchase more questions to continue..." : undefined} />
    </div>
  );
}
