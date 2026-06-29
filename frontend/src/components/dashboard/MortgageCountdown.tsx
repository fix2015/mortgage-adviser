import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function getColor(days: number, total: number): "green" | "amber" | "red" {
  const ratio = days / total;
  if (ratio > 0.5) return "green";
  if (ratio > 0.2) return "amber";
  return "red";
}

const COLOR_MAP = {
  green: { bg: "#dcfce7", text: "#166534", border: "#bbf7d0", dot: "#059669" },
  amber: { bg: "#fef3c7", text: "#92400e", border: "#fde68a", dot: "#d97706" },
  red: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca", dot: "#dc2626" },
};

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = 0;
    const end = value;
    const duration = 1200;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value]);

  return <>{display}{suffix}</>;
}

const COMPLETION_MILESTONES = [
  { week: 0, label: "Application Submitted", icon: CheckCircle2 },
  { week: 2, label: "Valuation Booked", icon: Calendar },
  { week: 4, label: "Mortgage Offer", icon: CheckCircle2 },
  { week: 8, label: "Exchange of Contracts", icon: CheckCircle2 },
  { week: 12, label: "Completion & Keys", icon: CheckCircle2 },
];

function calcStampDutySaving(propertyValue: number): number {
  if (propertyValue <= 425000) return 0;
  if (propertyValue <= 625000) return (propertyValue - 425000) * 0.05;
  // Over 625k, no FTB relief - but return what they would have saved
  let standardDuty = 0;
  const bands = [
    { threshold: 250000, rate: 0 },
    { threshold: 925000, rate: 0.05 },
    { threshold: 1500000, rate: 0.10 },
    { threshold: Infinity, rate: 0.12 },
  ];
  let remaining = propertyValue;
  let prevThreshold = 0;
  for (const band of bands) {
    const taxable = Math.min(remaining, band.threshold - prevThreshold);
    if (taxable <= 0) break;
    standardDuty += taxable * band.rate;
    remaining -= taxable;
    prevThreshold = band.threshold;
  }
  return standardDuty;
}

export function MortgageCountdown() {
  const { user } = useAuth();
  const now = new Date();

  // Rate Lock Window: 180 days from account creation or now
  const consultationStart = user?.created_at ? new Date(user.created_at) : now;
  const rateLockEnd = addDays(consultationStart, 180);
  const rateLockDaysLeft = Math.max(0, daysBetween(now, rateLockEnd));
  const rateLockColor = getColor(rateLockDaysLeft, 180);

  // Estimated Completion: 12 weeks from today
  const completionDate = addWeeks(now, 12);
  const completionDaysLeft = daysBetween(now, completionDate);

  // Stamp Duty: FTB info
  const propertyValue = user?.property_value || 300000;
  const isFirstTimeBuyer = user?.buyer_type === "first_time" || !user?.buyer_type;
  const stampDutySaving = isFirstTimeBuyer ? calcStampDutySaving(propertyValue) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card variant="glass" className="relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.15) 100%)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <Clock className="h-5 w-5 text-ds-text-accent" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ds-text-primary">Mortgage Timeline</h3>
            <p className="text-xs text-ds-text-muted mt-0.5">Key deadlines and milestones for your application</p>
          </div>
        </div>

        {/* Countdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Rate Lock Window */}
          <div
            className="rounded-xl p-4 border"
            style={{ backgroundColor: COLOR_MAP[rateLockColor].bg + "40", borderColor: COLOR_MAP[rateLockColor].border }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLOR_MAP[rateLockColor].dot }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: COLOR_MAP[rateLockColor].text }}>Rate Lock Window</span>
            </div>
            <div className="text-center mb-2">
              <p className="text-3xl font-bold text-ds-text-primary leading-none">
                <AnimatedCounter value={rateLockDaysLeft} />
              </p>
              <p className="text-xs text-ds-text-muted mt-1">days remaining</p>
            </div>
            <p className="text-[11px] text-ds-text-secondary leading-relaxed">
              Mortgage offers typically last 6 months. Rates you were quoted are valid for ~{rateLockDaysLeft} more days.
            </p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-white/60 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: COLOR_MAP[rateLockColor].dot }}
                initial={{ width: 0 }}
                animate={{ width: `${(rateLockDaysLeft / 180) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Estimated Completion */}
          <div
            className="rounded-xl p-4 border"
            style={{ backgroundColor: "rgba(5,150,105,0.06)", borderColor: "rgba(5,150,105,0.2)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#059669" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#059669" }}>Est. Completion</span>
            </div>
            <div className="text-center mb-2">
              <p className="text-3xl font-bold text-ds-text-primary leading-none">
                <AnimatedCounter value={completionDaysLeft} />
              </p>
              <p className="text-xs text-ds-text-muted mt-1">days (~12 weeks)</p>
            </div>
            <p className="text-[11px] text-ds-text-secondary leading-relaxed">
              If you apply today, estimated completion: <span className="font-semibold text-ds-text-primary">{formatDate(completionDate)}</span>
            </p>
          </div>

          {/* Stamp Duty */}
          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: isFirstTimeBuyer && propertyValue <= 425000 ? "rgba(5,150,105,0.06)" : "rgba(217,119,6,0.06)",
              borderColor: isFirstTimeBuyer && propertyValue <= 425000 ? "rgba(5,150,105,0.2)" : "rgba(217,119,6,0.2)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: isFirstTimeBuyer && propertyValue <= 425000 ? "#059669" : "#d97706" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: isFirstTimeBuyer && propertyValue <= 425000 ? "#059669" : "#d97706" }}>
                Stamp Duty
              </span>
            </div>
            <div className="text-center mb-2">
              {isFirstTimeBuyer ? (
                <>
                  <p className="text-3xl font-bold text-ds-text-primary leading-none">
                    {propertyValue <= 425000 ? (
                      <>\u00A30</>
                    ) : (
                      <>\u00A3<AnimatedCounter value={stampDutySaving} /></>
                    )}
                  </p>
                  <p className="text-xs text-ds-text-muted mt-1">
                    {propertyValue <= 425000 ? "tax free!" : "stamp duty due"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold text-ds-text-primary leading-none">
                    \u00A3<AnimatedCounter value={stampDutySaving} />
                  </p>
                  <p className="text-xs text-ds-text-muted mt-1">stamp duty due</p>
                </>
              )}
            </div>
            <p className="text-[11px] text-ds-text-secondary leading-relaxed">
              {isFirstTimeBuyer
                ? propertyValue <= 425000
                  ? "FTB relief: no stamp duty on properties up to \u00A3425,000."
                  : propertyValue <= 625000
                    ? "FTB relief: 5% only on the portion above \u00A3425,000."
                    : "Property exceeds \u00A3625,000 \u2014 standard stamp duty rates apply."
                : "Standard stamp duty rates apply to your property value."
              }
            </p>
          </div>
        </div>

        {/* Completion Timeline */}
        <div className="rounded-xl border border-ds-border-default bg-white p-4">
          <h4 className="text-sm font-semibold text-ds-text-primary mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-ds-text-accent" />
            Week-by-Week Timeline
          </h4>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-[15px] top-3 bottom-3 w-0.5 bg-ds-border-default" />

            <div className="space-y-0">
              {COMPLETION_MILESTONES.map((milestone, idx) => {
                const milestoneDate = addWeeks(now, milestone.week);
                const Icon = milestone.icon;
                const isLast = idx === COMPLETION_MILESTONES.length - 1;
                return (
                  <motion.div
                    key={milestone.week}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-4 relative py-2.5"
                  >
                    <div
                      className={cn(
                        "flex h-[30px] w-[30px] items-center justify-center rounded-full z-10 shrink-0 border-2",
                        isLast
                          ? "bg-ds-accent-primary/10 border-ds-accent-primary"
                          : "bg-white border-ds-border-default"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", isLast ? "text-ds-text-accent" : "text-ds-text-muted")} />
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className={cn("text-sm font-medium", isLast ? "text-ds-text-accent" : "text-ds-text-primary")}>{milestone.label}</p>
                        <p className="text-[10px] text-ds-text-muted">
                          Week {milestone.week} \u2014 {formatDate(milestoneDate)}
                        </p>
                      </div>
                      {milestone.week === 0 && (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>
                          Start here
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-[10px] text-ds-text-muted mt-4 text-center">
          Timelines are estimates based on UK averages. Actual timelines may vary based on circumstances.
        </p>
      </Card>
    </motion.div>
  );
}
