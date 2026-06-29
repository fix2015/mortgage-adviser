import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, MessageSquare, CheckCircle2, PoundSterling, Percent, Building2, Calendar, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

interface CaseStudy {
  id: number;
  profile: string;
  income: string;
  deposit: string;
  property: string;
  lender: string;
  rate: string;
  term: string;
  monthly: string;
  approved: boolean;
  tip: string;
  tags: string[];
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 1,
    profile: "Company Director",
    income: "\u00A385,000",
    deposit: "20%",
    property: "\u00A3390,000",
    lender: "Halifax",
    rate: "4.19%",
    term: "25 years",
    monthly: "\u00A31,685",
    approved: true,
    tip: "Used SA302 + company accounts. Specialist broker helped with director income assessment.",
    tags: ["Director", "20% deposit", "First-time buyer"],
  },
  {
    id: 2,
    profile: "Self-Employed Freelancer",
    income: "\u00A355,000",
    deposit: "15%",
    property: "\u00A3320,000",
    lender: "Kensington",
    rate: "4.69%",
    term: "30 years",
    monthly: "\u00A31,402",
    approved: true,
    tip: "2 years of SA302s required. Income averaged across both years.",
    tags: ["Self-employed", "15% deposit"],
  },
  {
    id: 3,
    profile: "Employed Couple",
    income: "\u00A372,000 combined",
    deposit: "10%",
    property: "\u00A3350,000",
    lender: "Nationwide",
    rate: "4.39%",
    term: "25 years",
    monthly: "\u00A31,743",
    approved: true,
    tip: "Joint application. Both P60s and payslips required. Nationwide accepted bonuses.",
    tags: ["Employed", "Joint", "10% deposit"],
  },
  {
    id: 4,
    profile: "CIS Contractor",
    income: "\u00A348,000",
    deposit: "25%",
    property: "\u00A3240,000",
    lender: "Kent Reliance",
    rate: "5.09%",
    term: "25 years",
    monthly: "\u00A31,054",
    approved: true,
    tip: "CIS income accepted with 1 year SA302. Higher deposit offset the income type risk.",
    tags: ["CIS", "25% deposit"],
  },
  {
    id: 5,
    profile: "IT Contractor (Ltd)",
    income: "\u00A395,000",
    deposit: "15%",
    property: "\u00A3450,000",
    lender: "Vida Homeloans",
    rate: "4.49%",
    term: "30 years",
    monthly: "\u00A31,937",
    approved: true,
    tip: "Day rate contractor. Vida used gross contract income \u00D7 46 weeks. No SA302 needed.",
    tags: ["Contractor", "Ltd", "15% deposit"],
  },
  {
    id: 6,
    profile: "First-Time Buyer (Employed)",
    income: "\u00A335,000",
    deposit: "5%",
    property: "\u00A3220,000",
    lender: "HSBC",
    rate: "5.29%",
    term: "35 years",
    monthly: "\u00A31,108",
    approved: true,
    tip: "Used LISA for \u00A31,000 bonus on deposit. \u00A30 stamp duty with FTB relief.",
    tags: ["Employed", "First-time", "5% deposit", "LISA"],
  },
];

const EMPLOYMENT_MAP: Record<string, string[]> = {
  employed: ["Employed", "First-time", "Joint"],
  self_employed: ["Self-employed", "Freelancer"],
  cis_contractor: ["CIS"],
  company_director: ["Director", "Ltd", "Contractor"],
};

function getRelevanceScore(study: CaseStudy, employmentType: string | null): number {
  if (!employmentType) return 0;
  const keywords = EMPLOYMENT_MAP[employmentType] || [];
  let score = 0;
  for (const keyword of keywords) {
    if (study.tags.some((t) => t.toLowerCase().includes(keyword.toLowerCase()))) score += 2;
    if (study.profile.toLowerCase().includes(keyword.toLowerCase())) score += 1;
  }
  return score;
}

export function MortgageTwin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const sorted = [...CASE_STUDIES].sort((a, b) => {
    const scoreA = getRelevanceScore(a, user?.employment_type || null);
    const scoreB = getRelevanceScore(b, user?.employment_type || null);
    return scoreB - scoreA;
  });

  const topMatchId = sorted[0]?.id;
  const displayed = showAll ? sorted : sorted.slice(0, 3);

  const handleAskAboutLender = (lender: string, profile: string) => {
    const question = `Tell me about getting a mortgage with ${lender}. I have a similar profile to a ${profile}. What are their criteria and current rates?`;
    localStorage.setItem("chat_prefill_message", question);
    navigate("/dashboard/chat");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card variant="glass" className="relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <Users className="h-5 w-5 text-ds-text-accent" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ds-text-primary">People Like You Who Got Approved</h3>
            <p className="text-xs text-ds-text-muted mt-0.5">Real anonymised case studies from similar applicants</p>
          </div>
        </div>

        {/* Case Study Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((study, idx) => {
            const isTopMatch = study.id === topMatchId && user?.employment_type;
            return (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={cn(
                  "rounded-xl border bg-white hover:shadow-md transition-all duration-200 relative",
                  isTopMatch
                    ? "border-ds-accent-primary/40 ring-1 ring-ds-accent-primary/20"
                    : "border-ds-border-default hover:border-ds-accent-primary/30"
                )}
              >
                <div className="p-4">
                  {/* Top row: profile + approved badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ds-accent-primary/10">
                        <Building2 className="h-4 w-4 text-ds-text-accent" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-ds-text-primary leading-tight">{study.profile}</h4>
                        <p className="text-[10px] text-ds-text-muted">{study.lender}</p>
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      APPROVED
                    </span>
                  </div>

                  {/* Best match label */}
                  {isTopMatch && (
                    <div className="mb-3 text-[10px] font-semibold text-ds-text-accent bg-ds-accent-primary/10 rounded-md px-2 py-1 text-center">
                      Best match for your profile
                    </div>
                  )}

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <PoundSterling className="h-3 w-3 text-ds-text-muted" />
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-ds-text-muted">Income</p>
                        <p className="text-xs font-bold text-ds-text-primary">{study.income}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-ds-text-muted" />
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-ds-text-muted">Property</p>
                        <p className="text-xs font-bold text-ds-text-primary">{study.property}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Percent className="h-3 w-3 text-ds-text-muted" />
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-ds-text-muted">Rate</p>
                        <p className="text-xs font-bold text-ds-text-primary">{study.rate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-ds-text-muted" />
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-ds-text-muted">Monthly</p>
                        <p className="text-xs font-bold text-ds-text-primary">{study.monthly}</p>
                      </div>
                    </div>
                  </div>

                  {/* Deposit + Term row */}
                  <div className="flex items-center gap-2 text-[10px] text-ds-text-muted mb-3">
                    <span className="bg-ds-bg-surface rounded px-1.5 py-0.5">{study.deposit} deposit</span>
                    <span className="bg-ds-bg-surface rounded px-1.5 py-0.5">{study.term}</span>
                  </div>

                  {/* Tip */}
                  <div className="rounded-lg bg-ds-accent-secondary/5 border border-ds-accent-secondary/15 p-2.5 mb-3">
                    <div className="flex items-start gap-1.5">
                      <Lightbulb className="h-3 w-3 text-ds-accent-secondary shrink-0 mt-0.5" />
                      <p className="text-[11px] text-ds-text-secondary leading-relaxed">{study.tip}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {study.tags.map((tag) => (
                      <span key={tag} className="text-[9px] font-medium text-ds-text-muted bg-ds-bg-surface rounded-full px-2 py-0.5 border border-ds-border-default">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-1.5 text-xs hover:bg-ds-accent-primary/10 hover:text-ds-text-accent"
                    onClick={() => handleAskAboutLender(study.lender, study.profile)}
                  >
                    <MessageSquare className="h-3 w-3" />
                    Ask AI about {study.lender}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Show more / less */}
        {CASE_STUDIES.length > 3 && (
          <div className="text-center mt-4">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-ds-text-accent hover:underline font-medium"
            >
              {showAll ? "Show fewer cases" : `Show all ${CASE_STUDIES.length} cases`}
            </button>
          </div>
        )}

        <p className="text-[10px] text-ds-text-muted mt-4 text-center">
          Cases are anonymised and illustrative. Actual outcomes depend on individual circumstances.
        </p>
      </Card>
    </motion.div>
  );
}
