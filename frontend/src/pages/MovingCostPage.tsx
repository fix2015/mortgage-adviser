import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Truck, PoundSterling, Info, Minus, Plus, Calendar } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface CostItem {
  key: string;
  label: string;
  min: number;
  max: number;
  value: number;
  notes: string;
  whenPaid: string;
}

function calcStampDuty(price: number, isFirstTime: boolean): number {
  if (isFirstTime) {
    if (price <= 425000) return 0;
    if (price <= 625000) return (price - 425000) * 0.05;
  }
  let duty = 0;
  const bands = [
    { threshold: 250000, rate: 0 },
    { threshold: 925000, rate: 0.05 },
    { threshold: 1500000, rate: 0.10 },
    { threshold: Infinity, rate: 0.12 },
  ];
  let remaining = price;
  let prevThreshold = 0;
  for (const band of bands) {
    const taxable = Math.min(remaining, band.threshold - prevThreshold);
    if (taxable <= 0) break;
    duty += taxable * band.rate;
    remaining -= taxable;
    prevThreshold = band.threshold;
  }
  return duty;
}

function getLandRegistryFee(price: number): number {
  if (price <= 80000) return 45;
  if (price <= 100000) return 95;
  if (price <= 200000) return 145;
  if (price <= 500000) return 230;
  if (price <= 1000000) return 330;
  return 455;
}

function formatPounds(amount: number): string {
  return `\u00A3${Math.round(amount).toLocaleString("en-GB")}`;
}

const COLORS = [
  "#6366f1", "#059669", "#d97706", "#dc2626", "#8b5cf6",
  "#0ea5e9", "#f97316", "#14b8a6", "#ec4899", "#84cc16",
];

const TIMELINE_ITEMS = [
  { stage: "Application", costs: ["Mortgage Arrangement Fee", "Mortgage Broker Fee", "Valuation Fee"], timing: "At application" },
  { stage: "Pre-Exchange", costs: ["Survey", "Solicitor/Conveyancer", "EPC Certificate"], timing: "2-6 weeks" },
  { stage: "Exchange", costs: ["Stamp Duty (HMRC)", "Deposit balance"], timing: "6-10 weeks" },
  { stage: "Completion", costs: ["Land Registry Fee", "Removal Costs"], timing: "Completion day" },
];

export function MovingCostPage() {
  const { user } = useAuth();
  const [propertyValue, setPropertyValue] = useState(user?.property_value || 300000);
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(user?.buyer_type === "first_time" || !user?.buyer_type);
  const [mortgageType, setMortgageType] = useState<"repayment" | "interest_only">("repayment");

  const stampDuty = useMemo(() => calcStampDuty(propertyValue, isFirstTimeBuyer), [propertyValue, isFirstTimeBuyer]);
  const landRegistryFee = useMemo(() => getLandRegistryFee(propertyValue), [propertyValue]);

  const defaultCosts: CostItem[] = useMemo(() => [
    { key: "stamp_duty", label: "Stamp Duty", min: 0, max: Math.max(stampDuty, 1), value: stampDuty, notes: isFirstTimeBuyer && propertyValue <= 425000 ? "FTB relief: no stamp duty" : "Based on property value + buyer status", whenPaid: "On completion" },
    { key: "solicitor", label: "Solicitor/Conveyancer", min: 1500, max: 2500, value: 1800, notes: "Typical range for conveyancing", whenPaid: "Pre-exchange & completion" },
    { key: "survey_l2", label: "Survey (Level 2)", min: 400, max: 700, value: 500, notes: "HomeBuyer report", whenPaid: "After offer accepted" },
    { key: "survey_l3", label: "Survey (Level 3)", min: 600, max: 1500, value: 0, notes: "Full structural (optional)", whenPaid: "After offer accepted" },
    { key: "arrangement_fee", label: "Mortgage Arrangement Fee", min: 0, max: 1999, value: 999, notes: "Varies by lender and product", whenPaid: "At application or added to loan" },
    { key: "broker_fee", label: "Mortgage Broker Fee", min: 0, max: 500, value: 0, notes: "Some charge, some are free", whenPaid: "At application" },
    { key: "valuation_fee", label: "Valuation Fee", min: 0, max: 300, value: 0, notes: "Often free with lender", whenPaid: "At application" },
    { key: "land_registry", label: "Land Registry Fee", min: 45, max: 455, value: landRegistryFee, notes: "Based on property value", whenPaid: "On completion" },
    { key: "removal", label: "Removal Costs", min: 500, max: 1500, value: 800, notes: "Depends on distance and volume", whenPaid: "Completion day" },
    { key: "epc", label: "EPC Certificate", min: 60, max: 120, value: 0, notes: "If not provided by seller", whenPaid: "Pre-exchange" },
  ], [stampDuty, isFirstTimeBuyer, propertyValue, landRegistryFee]);

  const [costs, setCosts] = useState<CostItem[]>(defaultCosts);

  // Sync stamp duty and land registry when property value changes
  useMemo(() => {
    setCosts((prev) => prev.map((c) => {
      if (c.key === "stamp_duty") {
        const sd = calcStampDuty(propertyValue, isFirstTimeBuyer);
        return { ...c, value: sd, max: Math.max(sd, 1), notes: isFirstTimeBuyer && propertyValue <= 425000 ? "FTB relief: no stamp duty" : "Based on property value + buyer status" };
      }
      if (c.key === "land_registry") {
        const lr = getLandRegistryFee(propertyValue);
        return { ...c, value: lr };
      }
      return c;
    }));
  }, [propertyValue, isFirstTimeBuyer]);

  const adjustCost = (key: string, delta: number) => {
    setCosts((prev) => prev.map((c) => {
      if (c.key !== key) return c;
      const step = c.max >= 1000 ? 100 : 50;
      const newVal = Math.max(0, Math.min(c.max * 2, c.value + delta * step));
      return { ...c, value: newVal };
    }));
  };

  const setCustomCost = (key: string, value: number) => {
    setCosts((prev) => prev.map((c) => c.key === key ? { ...c, value: Math.max(0, value) } : c));
  };

  const totalCost = costs.reduce((sum, c) => sum + c.value, 0);
  const pieData = costs.filter((c) => c.value > 0).map((c) => ({ name: c.label, value: c.value }));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 h-full overflow-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary flex items-center gap-2">
          <Truck className="h-6 w-6 text-ds-text-accent" />
          Cost of Moving Calculator
        </h1>
        <p className="text-sm text-ds-text-secondary mt-1">See the total cost of buying a property, not just the mortgage.</p>
      </div>

      {/* Controls */}
      <Card variant="glass">
        <h2 className="text-sm font-semibold text-ds-text-primary mb-4">Your Details</h2>
        <div className="space-y-5">
          {/* Property Value Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-ds-text-secondary">Property Value</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={propertyValue}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!isNaN(v)) setPropertyValue(Math.min(Math.max(v, 50000), 2000000));
                  }}
                  className="w-28 text-right text-sm font-bold text-ds-text-primary bg-ds-bg-tertiary border border-ds-border-default rounded-lg px-2 py-1 focus:outline-none focus:border-ds-border-accent"
                />
              </div>
            </div>
            <input
              type="range" min={50000} max={2000000} step={5000} value={propertyValue}
              onChange={(e) => setPropertyValue(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-ds-bg-surface cursor-pointer accent-[var(--ds-accent-primary)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--ds-accent-primary)] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab"
            />
            <div className="flex justify-between mt-1 text-[10px] text-ds-text-muted">
              <span>\u00A350,000</span>
              <span>\u00A32,000,000</span>
            </div>
          </div>

          {/* First-Time Buyer Toggle + Mortgage Type */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-ds-text-secondary mb-2 block">Buyer Status</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsFirstTimeBuyer(true)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2.5 border-2 transition-all text-center text-sm font-medium",
                    isFirstTimeBuyer
                      ? "border-ds-accent-primary bg-ds-accent-primary/10 text-ds-text-accent"
                      : "border-ds-border-default text-ds-text-secondary hover:border-ds-border-strong"
                  )}
                >
                  First-Time Buyer
                </button>
                <button
                  onClick={() => setIsFirstTimeBuyer(false)}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2.5 border-2 transition-all text-center text-sm font-medium",
                    !isFirstTimeBuyer
                      ? "border-ds-accent-primary bg-ds-accent-primary/10 text-ds-text-accent"
                      : "border-ds-border-default text-ds-text-secondary hover:border-ds-border-strong"
                  )}
                >
                  Home Mover
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-ds-text-secondary mb-2 block">Mortgage Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMortgageType("repayment")}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2.5 border-2 transition-all text-center text-sm font-medium",
                    mortgageType === "repayment"
                      ? "border-ds-accent-primary bg-ds-accent-primary/10 text-ds-text-accent"
                      : "border-ds-border-default text-ds-text-secondary hover:border-ds-border-strong"
                  )}
                >
                  Repayment
                </button>
                <button
                  onClick={() => setMortgageType("interest_only")}
                  className={cn(
                    "flex-1 rounded-lg px-3 py-2.5 border-2 transition-all text-center text-sm font-medium",
                    mortgageType === "interest_only"
                      ? "border-ds-accent-primary bg-ds-accent-primary/10 text-ds-text-accent"
                      : "border-ds-border-default text-ds-text-secondary hover:border-ds-border-strong"
                  )}
                >
                  Interest Only
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FTB info banner */}
        {isFirstTimeBuyer && propertyValue <= 425000 && (
          <div className="flex items-center gap-2 rounded-lg bg-ds-feedback-success/10 border border-ds-feedback-success/20 px-4 py-2.5 mt-4">
            <Info className="h-4 w-4 text-ds-feedback-success shrink-0" />
            <p className="text-xs text-ds-feedback-success font-medium">First-time buyer relief: \u00A30 stamp duty on properties up to \u00A3425,000</p>
          </div>
        )}
      </Card>

      {/* Cost Breakdown Table */}
      <Card variant="glass">
        <h2 className="text-sm font-semibold text-ds-text-primary mb-4">Cost Breakdown</h2>
        <div className="rounded-lg border border-ds-border-default overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ds-bg-surface">
                <th className="text-left text-xs font-semibold text-ds-text-secondary px-4 py-2.5 border-b border-ds-border-default">Cost</th>
                <th className="text-center text-xs font-semibold text-ds-text-secondary px-4 py-2.5 border-b border-ds-border-default w-44">Amount</th>
                <th className="text-left text-xs font-semibold text-ds-text-secondary px-4 py-2.5 border-b border-ds-border-default hidden sm:table-cell">Notes</th>
                <th className="text-left text-xs font-semibold text-ds-text-secondary px-4 py-2.5 border-b border-ds-border-default hidden md:table-cell w-32">When Paid</th>
              </tr>
            </thead>
            <tbody>
              {costs.map((cost, idx) => (
                <tr key={cost.key} className={idx % 2 === 0 ? "bg-white" : "bg-ds-bg-tertiary"}>
                  <td className="px-4 py-3 font-medium text-ds-text-primary border-b border-ds-border-default">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      {cost.label}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center border-b border-ds-border-default">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => adjustCost(cost.key, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-ds-border-default bg-white hover:bg-ds-bg-surface transition-colors text-ds-text-secondary"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        value={cost.value}
                        onChange={(e) => setCustomCost(cost.key, Number(e.target.value) || 0)}
                        className="w-20 text-center text-sm font-bold text-ds-text-primary bg-ds-bg-tertiary border border-ds-border-default rounded-lg px-1 py-1 focus:outline-none focus:border-ds-border-accent"
                      />
                      <button
                        onClick={() => adjustCost(cost.key, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-ds-border-default bg-white hover:bg-ds-bg-surface transition-colors text-ds-text-secondary"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-[9px] text-ds-text-muted mt-0.5">{formatPounds(cost.min)} - {formatPounds(cost.max)}</p>
                  </td>
                  <td className="px-4 py-3 text-ds-text-secondary text-xs border-b border-ds-border-default hidden sm:table-cell">{cost.notes}</td>
                  <td className="px-4 py-3 text-ds-text-muted text-xs border-b border-ds-border-default hidden md:table-cell">{cost.whenPaid}</td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="bg-ds-accent-primary/5">
                <td className="px-4 py-3 font-bold text-ds-text-primary border-t-2 border-ds-accent-primary/20">Total Moving Costs</td>
                <td className="px-4 py-3 text-center font-bold text-lg text-ds-text-accent border-t-2 border-ds-accent-primary/20">{formatPounds(totalCost)}</td>
                <td className="px-4 py-3 text-ds-text-secondary text-xs border-t-2 border-ds-accent-primary/20 hidden sm:table-cell">On top of your deposit</td>
                <td className="px-4 py-3 border-t-2 border-ds-accent-primary/20 hidden md:table-cell" />
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card variant="glass">
          <h3 className="text-sm font-semibold text-ds-text-primary mb-4">Cost Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatPounds(Number(value))}
                  contentStyle={{
                    background: "var(--ds-bg-secondary)",
                    border: "1px solid var(--ds-border-default)",
                    borderRadius: "8px",
                    color: "var(--ds-text-primary)",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px" }}
                  formatter={(value: string) => <span className="text-ds-text-secondary">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Central total */}
          <div className="text-center -mt-4">
            <p className="text-xs text-ds-text-muted">Total additional costs</p>
            <p className="text-2xl font-bold text-ds-text-accent">{formatPounds(totalCost)}</p>
            <p className="text-[11px] text-ds-text-secondary mt-1">You need this on top of your deposit</p>
          </div>
        </Card>

        {/* Payment Timeline */}
        <Card variant="glass">
          <h3 className="text-sm font-semibold text-ds-text-primary mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-ds-text-accent" />
            When Each Cost Is Paid
          </h3>
          <div className="space-y-0 relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-ds-border-default" />

            {TIMELINE_ITEMS.map((item, idx) => {
              const stageCosts = costs.filter((c) => {
                const label = c.label;
                return item.costs.some((ic) => label.includes(ic) || ic.includes(label));
              });
              const stageTotal = stageCosts.reduce((s, c) => s + c.value, 0);

              return (
                <motion.div
                  key={item.stage}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-4 relative py-3"
                >
                  <div
                    className={cn(
                      "flex h-[30px] w-[30px] items-center justify-center rounded-full z-10 shrink-0 border-2",
                      idx === TIMELINE_ITEMS.length - 1
                        ? "bg-ds-accent-primary/10 border-ds-accent-primary"
                        : "bg-white border-ds-border-default"
                    )}
                  >
                    <span className="text-[10px] font-bold text-ds-text-muted">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-ds-text-primary">{item.stage}</p>
                        <p className="text-[10px] text-ds-text-muted">{item.timing}</p>
                      </div>
                      {stageTotal > 0 && (
                        <span className="text-sm font-bold text-ds-text-primary">{formatPounds(stageTotal)}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {item.costs.map((costLabel) => {
                        const matchedCost = costs.find((c) => c.label.includes(costLabel) || costLabel.includes(c.label));
                        if (!matchedCost || matchedCost.value === 0) return null;
                        return (
                          <span key={costLabel} className="text-[9px] text-ds-text-muted bg-ds-bg-surface rounded px-1.5 py-0.5 border border-ds-border-default">
                            {matchedCost.label}: {formatPounds(matchedCost.value)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Summary banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card variant="glass">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <PoundSterling className="h-7 w-7 text-ds-text-accent" />
              </div>
              <div>
                <p className="text-sm text-ds-text-secondary">Total estimated moving cost</p>
                <p className="text-3xl font-bold text-ds-text-primary">{formatPounds(totalCost)}</p>
                <p className="text-xs text-ds-text-muted mt-0.5">on top of your deposit for a {formatPounds(propertyValue)} property</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <p className="text-[10px] text-ds-text-muted text-center pb-4">
        Estimates are based on typical UK costs. Actual amounts may vary. Always get quotes from providers.
      </p>
    </div>
  );
}
