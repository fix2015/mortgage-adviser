import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Send,
  Search,
  Award,
  Scale,
  Repeat,
  Key,
  Check,
  ChevronDown,
  ChevronUp,
  PoundSterling,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

interface MortgageTimelineProps {
  propertyValue?: number;
  readinessPercentage?: number;
}

interface TimelineStep {
  title: string;
  duration: string;
  description: string;
  action: string;
  icon: React.ElementType;
  weeksMin: number;
  weeksMax: number;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    title: "Document Collection",
    duration: "1-2 weeks",
    description: "Gather all required documents including payslips, bank statements, ID, and proof of address.",
    action: "Upload documents to your dashboard for AI analysis",
    icon: FileText,
    weeksMin: 1,
    weeksMax: 2,
  },
  {
    title: "Mortgage Application",
    duration: "1 day",
    description: "Submit your application to your chosen lender with all supporting documents.",
    action: "Complete the application form with your adviser",
    icon: Send,
    weeksMin: 0,
    weeksMax: 0,
  },
  {
    title: "Valuation",
    duration: "1-2 weeks",
    description: "The lender instructs a surveyor to value the property you want to buy.",
    action: "Ensure access to the property for the surveyor",
    icon: Search,
    weeksMin: 1,
    weeksMax: 2,
  },
  {
    title: "Mortgage Offer",
    duration: "2-4 weeks",
    description: "The lender reviews everything and issues a formal mortgage offer.",
    action: "Review the offer terms carefully before accepting",
    icon: Award,
    weeksMin: 2,
    weeksMax: 4,
  },
  {
    title: "Conveyancing",
    duration: "4-8 weeks",
    description: "Your solicitor conducts legal searches, reviews the contract, and handles legal requirements.",
    action: "Respond promptly to any solicitor queries",
    icon: Scale,
    weeksMin: 4,
    weeksMax: 8,
  },
  {
    title: "Exchange",
    duration: "1 day",
    description: "Contracts are exchanged between buyer and seller — the purchase becomes legally binding.",
    action: "Transfer your deposit to your solicitor",
    icon: Repeat,
    weeksMin: 0,
    weeksMax: 0,
  },
  {
    title: "Completion",
    duration: "1-2 weeks after exchange",
    description: "The remaining funds are transferred and the keys are handed over. You own your home!",
    action: "Collect your keys and move in!",
    icon: Key,
    weeksMin: 1,
    weeksMax: 2,
  },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function calculateMonthlyPayment(principal: number, annualRate: number, termYears: number): number {
  const monthlyRate = annualRate / 100 / 12;
  const totalPayments = termYears * 12;
  if (monthlyRate === 0) return principal / totalPayments;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1);
}

function getEstimatedDate(weeksFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + weeksFromNow * 7);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getCurrentStep(readinessPercentage: number): number {
  if (readinessPercentage < 100) return 0;
  return 1;
}

export function MortgageTimeline({ propertyValue = 300000, readinessPercentage = 0 }: MortgageTimelineProps) {
  const [showTimeline, setShowTimeline] = useState(true);

  const currentStepIndex = getCurrentStep(readinessPercentage);

  const currentRate = 4.75;
  const predictedRateLow = currentRate - 0.25;
  const predictedRateHigh = currentRate + 0.25;
  const predictedRateMid = currentRate;
  const annualGrowthLow = 0.03;
  const annualGrowthHigh = 0.05;
  const termYears = 25;
  const ltv = 0.9;

  const comparison = useMemo(() => {
    const loanAmount = propertyValue * ltv;

    // Buy Now
    const monthlyNow = calculateMonthlyPayment(loanAmount, currentRate, termYears);
    const totalCostNow = monthlyNow * termYears * 12;

    // Wait 6 months
    const propertyGrowthLow = propertyValue * (1 + annualGrowthLow * 0.5);
    const propertyGrowthHigh = propertyValue * (1 + annualGrowthHigh * 0.5);
    const propertyGrowthMid = (propertyGrowthLow + propertyGrowthHigh) / 2;
    const loanAmountWait = propertyGrowthMid * ltv;

    const monthlyWaitLow = calculateMonthlyPayment(loanAmountWait, predictedRateLow, termYears);
    const monthlyWaitHigh = calculateMonthlyPayment(loanAmountWait, predictedRateHigh, termYears);
    const monthlyWaitMid = calculateMonthlyPayment(loanAmountWait, predictedRateMid, termYears);

    const totalCostWaitMid = monthlyWaitMid * termYears * 12;
    const totalDifference = totalCostWaitMid - totalCostNow;
    const monthlyDifference = monthlyWaitMid - monthlyNow;
    const propertyIncrease = propertyGrowthMid - propertyValue;

    return {
      monthlyNow,
      totalCostNow,
      monthlyWaitLow,
      monthlyWaitHigh,
      monthlyWaitMid,
      totalCostWaitMid,
      totalDifference,
      monthlyDifference,
      propertyIncrease,
      propertyGrowthMid,
      loanAmount,
      loanAmountWait,
    };
  }, [propertyValue, currentRate, predictedRateLow, predictedRateHigh, predictedRateMid, termYears, ltv]);

  const cumulativeWeeksMin: number[] = [];
  const cumulativeWeeksMax: number[] = [];
  let runningMin = 0;
  let runningMax = 0;
  TIMELINE_STEPS.forEach((step) => {
    cumulativeWeeksMin.push(runningMin);
    cumulativeWeeksMax.push(runningMax);
    runningMin += step.weeksMin;
    runningMax += step.weeksMax;
  });

  const waitingCostsMore = comparison.totalDifference > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Buy Now vs Wait */}
      <Card variant="glass" className="relative overflow-hidden">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ds-accent-primary/10">
            <TrendingUp className="h-4 w-4 text-ds-text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ds-text-primary">Buy Now vs Wait 6 Months</h3>
            <p className="text-[11px] text-ds-text-muted">Based on {formatCurrency(propertyValue)} property value</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Buy Now Column */}
          <div className="rounded-xl border-2 border-ds-feedback-success/30 bg-ds-feedback-success/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2.5 w-2.5 rounded-full bg-ds-feedback-success" />
              <h4 className="text-sm font-bold text-ds-text-primary">Buy Now (July 2026)</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-ds-text-secondary">Interest Rate</span>
                <span className="font-semibold text-ds-text-primary">{currentRate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ds-text-secondary">Property Price</span>
                <span className="font-semibold text-ds-text-primary">{formatCurrency(propertyValue)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ds-text-secondary">Loan Amount (90% LTV)</span>
                <span className="font-semibold text-ds-text-primary">{formatCurrency(comparison.loanAmount)}</span>
              </div>
              <div className="h-px bg-ds-border-default" />
              <div className="flex justify-between text-xs">
                <span className="text-ds-text-secondary">Monthly Payment</span>
                <span className="font-bold text-ds-text-primary text-sm">{formatCurrency(Math.round(comparison.monthlyNow))}/mo</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ds-text-secondary">Total Cost ({termYears} years)</span>
                <span className="font-semibold text-ds-text-primary">{formatCurrency(Math.round(comparison.totalCostNow))}</span>
              </div>
            </div>
          </div>

          {/* Wait Column */}
          <div className="rounded-xl border-2 border-ds-border-default bg-ds-bg-surface/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2.5 w-2.5 rounded-full bg-ds-text-muted" />
              <h4 className="text-sm font-bold text-ds-text-primary">Wait 6 Months (Jan 2027)</h4>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-ds-text-secondary">Predicted Rate</span>
                <span className="font-semibold text-ds-text-primary">
                  {predictedRateLow.toFixed(2)}% - {predictedRateHigh.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ds-text-secondary">Est. Property Price</span>
                <span className="font-semibold text-ds-text-primary">
                  {formatCurrency(Math.round(comparison.propertyGrowthMid))}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ds-text-secondary">Loan Amount (90% LTV)</span>
                <span className="font-semibold text-ds-text-primary">{formatCurrency(Math.round(comparison.loanAmountWait))}</span>
              </div>
              <div className="h-px bg-ds-border-default" />
              <div className="flex justify-between text-xs">
                <span className="text-ds-text-secondary">Monthly Payment</span>
                <span className="font-bold text-ds-text-primary text-sm">
                  {formatCurrency(Math.round(comparison.monthlyWaitLow))}-{formatCurrency(Math.round(comparison.monthlyWaitHigh))}/mo
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ds-text-secondary">Total Cost ({termYears} years)</span>
                <span className="font-semibold text-ds-text-primary">{formatCurrency(Math.round(comparison.totalCostWaitMid))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verdict */}
        <div className={cn(
          "rounded-xl p-4 text-center",
          waitingCostsMore
            ? "bg-ds-feedback-error/10 border border-ds-feedback-error/20"
            : "bg-ds-feedback-success/10 border border-ds-feedback-success/20"
        )}>
          <div className="flex items-center justify-center gap-2 mb-1">
            {waitingCostsMore ? (
              <TrendingDown className="h-4 w-4 text-ds-feedback-error" />
            ) : (
              <TrendingUp className="h-4 w-4 text-ds-feedback-success" />
            )}
            <span className={cn(
              "text-sm font-bold",
              waitingCostsMore ? "text-ds-feedback-error" : "text-ds-feedback-success"
            )}>
              {waitingCostsMore
                ? `Waiting 6 months could cost you ${formatCurrency(Math.abs(Math.round(comparison.totalDifference)))} more`
                : `Waiting 6 months could save you ${formatCurrency(Math.abs(Math.round(comparison.totalDifference)))}`
              }
            </span>
          </div>
          <p className="text-[11px] text-ds-text-muted">
            Property prices estimated to rise {formatCurrency(Math.round(comparison.propertyIncrease))} in 6 months (3-5% annual growth)
          </p>
        </div>
      </Card>

      {/* Journey Timeline */}
      <Card variant="glass" className="relative overflow-hidden">
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="flex items-center justify-between w-full mb-2"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ds-accent-secondary/10">
              <Clock className="h-4 w-4 text-ds-accent-secondary" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-ds-text-primary">Your Mortgage Journey</h3>
              <p className="text-[11px] text-ds-text-muted">
                Estimated {runningMin}-{runningMax} weeks from start to keys
              </p>
            </div>
          </div>
          {showTimeline ? (
            <ChevronUp className="h-4 w-4 text-ds-text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-ds-text-muted" />
          )}
        </button>

        {showTimeline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="mt-4"
          >
            <div className="relative ml-4">
              {/* Vertical line */}
              <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-ds-border-default" />

              {TIMELINE_STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isFuture = index > currentStepIndex;

                const estimatedStart = getEstimatedDate(cumulativeWeeksMin[index]);
                const estimatedEnd = getEstimatedDate(cumulativeWeeksMax[index] + step.weeksMax);

                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="relative flex gap-4 pb-6 last:pb-0"
                  >
                    {/* Icon node */}
                    <div className="relative z-10 shrink-0">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                        isCompleted
                          ? "border-ds-feedback-success bg-ds-feedback-success/15"
                          : isCurrent
                            ? "border-ds-accent-primary bg-ds-accent-primary/10"
                            : "border-ds-border-default bg-ds-bg-surface"
                      )}>
                        {isCompleted ? (
                          <Check className="h-3.5 w-3.5 text-ds-feedback-success" />
                        ) : (
                          <StepIcon className={cn(
                            "h-3.5 w-3.5",
                            isCurrent ? "text-ds-text-accent" : "text-ds-text-muted"
                          )} />
                        )}
                      </div>
                      {isCurrent && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-ds-accent-primary"
                          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className={cn("flex-1 min-w-0", isFuture && "opacity-60")}>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={cn(
                          "text-sm font-semibold",
                          isCompleted ? "text-ds-feedback-success" : isCurrent ? "text-ds-text-primary" : "text-ds-text-secondary"
                        )}>
                          {step.title}
                        </h4>
                        <span className="text-[10px] font-medium text-ds-text-muted bg-ds-bg-surface px-2 py-0.5 rounded-full">
                          {step.duration}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-ds-text-accent bg-ds-accent-primary/10 px-2 py-0.5 rounded-full">
                            You are here
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ds-text-secondary mb-1">{step.description}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-ds-text-muted">
                        <Clock className="h-3 w-3" />
                        <span>Est. {estimatedStart} - {estimatedEnd}</span>
                      </div>
                      <p className="text-[11px] text-ds-text-accent mt-1 font-medium">{step.action}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}
