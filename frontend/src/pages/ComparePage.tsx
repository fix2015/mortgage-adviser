import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Star, Filter } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPounds } from "@/utils/format";
import type { LenderRecommendation } from "@/types";

const mockLenders: LenderRecommendation[] = [
  { lender: "Nationwide", rate: 4.49, type: "fixed", term: 2, monthly_payment: 1102, total_cost: 330600, ltv: 90, fees: 999, badge: "Best for first-time buyers" },
  { lender: "HSBC", rate: 4.39, type: "fixed", term: 5, monthly_payment: 1089, total_cost: 326700, ltv: 85, fees: 0, badge: "Best overall" },
  { lender: "Barclays", rate: 4.54, type: "fixed", term: 2, monthly_payment: 1108, total_cost: 332400, ltv: 90, fees: 899 },
  { lender: "Santander", rate: 4.65, type: "fixed", term: 5, monthly_payment: 1122, total_cost: 336600, ltv: 80, fees: 999 },
  { lender: "NatWest", rate: 4.72, type: "variable", term: 2, monthly_payment: 1131, total_cost: 339300, ltv: 95, fees: 0, badge: "Best for high LTV" },
  { lender: "Virgin Money", rate: 4.29, type: "tracker", term: 2, monthly_payment: 1076, total_cost: 322800, ltv: 75, fees: 1495, badge: "Best for remortgage" },
  { lender: "Halifax", rate: 4.58, type: "fixed", term: 3, monthly_payment: 1113, total_cost: 333900, ltv: 90, fees: 0 },
  { lender: "TSB", rate: 4.45, type: "fixed", term: 5, monthly_payment: 1096, total_cost: 328800, ltv: 85, fees: 995 },
];

export function ComparePage() {
  const [typeFilter, setTypeFilter] = useState<"all" | "fixed" | "variable" | "tracker">("all");
  const [ltvFilter, setLtvFilter] = useState<"all" | "60" | "75" | "85" | "90" | "95">("all");

  const filtered = mockLenders.filter((l) => {
    if (typeFilter !== "all" && l.type !== typeFilter) return false;
    if (ltvFilter !== "all" && l.ltv < parseInt(ltvFilter)) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 h-full overflow-auto">
      <div><h1 className="text-2xl font-bold text-ds-text-primary flex items-center gap-2"><BarChart3 className="h-6 w-6 text-ds-text-accent" />Lender Comparison</h1><p className="text-sm text-ds-text-secondary mt-1">AI-generated lender recommendations based on your profile. Upload documents for personalised results.</p></div>

      <Card variant="glass" className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2"><Filter className="h-4 w-4 text-ds-text-muted" /><span className="text-xs font-medium text-ds-text-secondary">Filters:</span></div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ds-text-muted">Type:</span>
          {(["all", "fixed", "variable", "tracker"] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${typeFilter === t ? "bg-ds-accent-primary/15 text-ds-text-accent border-ds-accent-primary/20" : "text-ds-text-muted border-ds-border-default hover:text-ds-text-secondary"}`}>{t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ds-text-muted">Max LTV:</span>
          {(["all", "60", "75", "85", "90", "95"] as const).map((l) => (
            <button key={l} onClick={() => setLtvFilter(l)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${ltvFilter === l ? "bg-ds-accent-primary/15 text-ds-text-accent border-ds-accent-primary/20" : "text-ds-text-muted border-ds-border-default hover:text-ds-text-secondary"}`}>{l === "all" ? "All" : `${l}%`}</button>
          ))}
        </div>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-ds-border-default">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-ds-border-default bg-ds-bg-surface/50">
            <th className="px-4 py-3 text-left text-xs font-medium text-ds-text-muted">Lender</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-ds-text-muted">Rate</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-ds-text-muted">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-ds-text-muted">Term</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-ds-text-muted">Monthly</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-ds-text-muted">Total Cost</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-ds-text-muted">Max LTV</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-ds-text-muted">Fees</th>
          </tr></thead>
          <tbody>{filtered.map((l, i) => (
            <motion.tr key={l.lender} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="border-b border-ds-border-default/50 hover:bg-ds-bg-surface/30 transition-colors">
              <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="text-ds-text-primary font-medium">{l.lender}</span>{l.badge && <Badge variant="success" className="text-[10px]"><Star className="h-2.5 w-2.5 mr-0.5" />{l.badge}</Badge>}</div></td>
              <td className="px-4 py-3 text-ds-accent-primary font-semibold">{l.rate}%</td>
              <td className="px-4 py-3"><Badge variant={l.type === "fixed" ? "accent" : l.type === "variable" ? "warning" : "default"}>{l.type}</Badge></td>
              <td className="px-4 py-3 text-ds-text-secondary">{l.term}yr</td>
              <td className="px-4 py-3 text-right text-ds-text-primary font-medium">{formatPounds(l.monthly_payment)}</td>
              <td className="px-4 py-3 text-right text-ds-text-secondary">{formatPounds(l.total_cost)}</td>
              <td className="px-4 py-3 text-center text-ds-text-secondary">{l.ltv}%</td>
              <td className="px-4 py-3 text-right text-ds-text-secondary">{l.fees === 0 ? "Free" : formatPounds(l.fees)}</td>
            </motion.tr>
          ))}</tbody>
        </table>
      </div>
      <p className="text-xs text-ds-text-muted text-center">Sample data for illustration. Upload your documents for personalised AI-powered recommendations.</p>
    </div>
  );
}
