import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, ChevronDown, ChevronUp, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { getNews } from "@/api/chat";
import type { NewsArticle } from "@/types";

const impactConfig = {
  high: { color: "bg-ds-feedback-error/15 text-ds-feedback-error border-ds-feedback-error/30", icon: AlertTriangle, label: "High Impact" },
  medium: { color: "bg-ds-feedback-warning/15 text-ds-feedback-warning border-ds-feedback-warning/30", icon: Info, label: "Medium Impact" },
  low: { color: "bg-ds-feedback-success/15 text-ds-feedback-success border-ds-feedback-success/30", icon: CheckCircle2, label: "Low Impact" },
};

export function NewsFeed({ compact = false, maxItems }: { compact?: boolean; maxItems?: number }) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => { try { const data = await getNews(); const sorted = [...data.articles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); setArticles(maxItems ? sorted.slice(0, maxItems) : sorted); } catch { setArticles([]); } finally { setLoading(false); } };
    load();
  }, [maxItems]);

  if (loading) return <Card><div className="flex items-center gap-2 mb-4"><Newspaper className="h-4 w-4 text-ds-text-accent" /><h2 className="text-sm font-semibold text-ds-text-primary">Mortgage News</h2></div><div className="flex justify-center py-6"><Spinner size="sm" /></div></Card>;
  if (articles.length === 0) return null;

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-ds-border-default"><Newspaper className="h-4 w-4 text-ds-text-accent" /><h2 className="text-sm font-semibold text-ds-text-primary">Mortgage Market News</h2></div>
      <div className={compact ? "divide-y divide-ds-border-default" : "p-4 space-y-3"}>
        {articles.map((article, index) => { const config = impactConfig[article.impact] || impactConfig.medium; const isExpanded = expandedIndex === index; return (
          <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className={compact ? "px-6 py-3" : ""}>
            <button onClick={() => setExpandedIndex(isExpanded ? null : index)} className="w-full text-left">
              <div className="flex items-start gap-3"><div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap"><h3 className={`font-medium text-ds-text-primary ${compact ? "text-xs" : "text-sm"}`}>{article.title}</h3><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${config.color}`}>{config.label}</span></div>
                <div className="flex items-center gap-3 text-[11px] text-ds-text-muted"><span>{article.date}</span><span className="text-ds-border-strong">|</span><span>{article.category}</span></div>
              </div><div className="shrink-0 mt-1">{isExpanded ? <ChevronUp className="h-4 w-4 text-ds-text-muted" /> : <ChevronDown className="h-4 w-4 text-ds-text-muted" />}</div></div>
            </button>
            <AnimatePresence>{isExpanded && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden"><p className="text-xs text-ds-text-secondary leading-relaxed mt-2">{article.summary}</p></motion.div>)}</AnimatePresence>
          </motion.div>
        ); })}
      </div>
    </Card>
  );
}
