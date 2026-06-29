import { useState, useMemo } from "react";
import { Calculator, Home, Users, UserCheck, Building2, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatPounds } from "@/utils/format";
import { cn } from "@/utils/cn";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type BuyerType = "first_time" | "home_mover" | "additional" | "remortgage";
type MortgageType = "repayment" | "interest_only";

function calcStampDuty(price: number, buyerType: BuyerType): number {
  if (buyerType === "remortgage") return 0;

  let duty = 0;

  if (buyerType === "first_time") {
    // FTB relief: £0 up to £425k, 5% on £425k-£625k, standard rates if over £625k
    if (price <= 425000) return 0;
    if (price <= 625000) return (price - 425000) * 0.05;
    // Over £625k — no FTB relief, use standard rates
  }

  // Standard rates (or FTB over £625k)
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

  // Additional property surcharge (3%)
  if (buyerType === "additional") {
    duty += price * 0.03;
  }

  return duty;
}

function calcMortgage(
  propertyValue: number,
  deposit: number,
  termYears: number,
  rate: number,
  buyerType: BuyerType,
  mortgageType: MortgageType
) {
  const loan = propertyValue - deposit;
  const mr = rate / 100 / 12;
  const np = termYears * 12;

  let mp: number;
  if (mortgageType === "interest_only") {
    mp = loan * mr;
  } else {
    mp = mr > 0 ? (loan * mr * Math.pow(1 + mr, np)) / (Math.pow(1 + mr, np) - 1) : loan / np;
  }

  const total = mp * np;
  const interest = mortgageType === "interest_only" ? total : total - loan;
  const ltv = (loan / propertyValue) * 100;
  const stampDuty = calcStampDuty(propertyValue, buyerType);

  return { monthlyPayment: mp, totalInterest: interest, totalCost: total, ltv, stampDuty, loanAmount: loan };
}

function generateSchedule(loan: number, rate: number, termYears: number, mortgageType: MortgageType) {
  const mr = rate / 100 / 12;
  const np = termYears * 12;
  let mp: number;
  if (mortgageType === "interest_only") {
    mp = loan * mr;
  } else {
    mp = mr > 0 ? (loan * mr * Math.pow(1 + mr, np)) / (Math.pow(1 + mr, np) - 1) : loan / np;
  }
  const data: { year: number; balance: number; paid: number }[] = [];
  let balance = loan;
  let totalPaid = 0;
  for (let y = 0; y <= termYears; y++) {
    data.push({ year: y, balance: Math.round(balance), paid: Math.round(totalPaid) });
    for (let m = 0; m < 12 && balance > 0; m++) {
      if (mortgageType === "interest_only") {
        totalPaid += mp;
      } else {
        const interest = balance * mr;
        const principal = mp - interest;
        balance = Math.max(0, balance - principal);
        totalPaid += mp;
      }
    }
  }
  return data;
}

const BUYER_TYPES: { value: BuyerType; label: string; icon: typeof Home; desc: string }[] = [
  { value: "first_time", label: "First-Time Buyer", icon: UserCheck, desc: "No stamp duty up to £425k" },
  { value: "home_mover", label: "Moving Home", icon: Home, desc: "Standard stamp duty rates" },
  { value: "additional", label: "Additional Property", icon: Building2, desc: "+3% surcharge applies" },
  { value: "remortgage", label: "Remortgage", icon: Users, desc: "No stamp duty" },
];

const MORTGAGE_TYPES: { value: MortgageType; label: string; desc: string }[] = [
  { value: "repayment", label: "Repayment", desc: "Pay off capital + interest" },
  { value: "interest_only", label: "Interest Only", desc: "Lower payments, capital due at end" },
];

export function CalculatorPage() {
  const [pv, setPv] = useState(300000);
  const [dep, setDep] = useState(30000);
  const [term, setTerm] = useState(25);
  const [rate, setRate] = useState(4.5);
  const [buyerType, setBuyerType] = useState<BuyerType>("first_time");
  const [mortgageType, setMortgageType] = useState<MortgageType>("repayment");

  const [pv2, setPv2] = useState(300000);
  const [dep2, setDep2] = useState(60000);
  const [term2, setTerm2] = useState(30);
  const [rate2, setRate2] = useState(3.9);
  const [showCompare, setShowCompare] = useState(false);

  const r1 = useMemo(() => calcMortgage(pv, Math.min(dep, pv), term, rate, buyerType, mortgageType), [pv, dep, term, rate, buyerType, mortgageType]);
  const r2 = useMemo(() => calcMortgage(pv2, Math.min(dep2, pv2), term2, rate2, buyerType, mortgageType), [pv2, dep2, term2, rate2, buyerType, mortgageType]);
  const schedule = useMemo(() => generateSchedule(r1.loanAmount, rate, term, mortgageType), [r1.loanAmount, rate, term, mortgageType]);

  const SliderRow = ({ label, value, set, min, max, step, fmt }: { label: string; value: number; set: (v: number) => void; min: number; max: number; step: number; fmt: (v: number) => string }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-ds-text-secondary">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!isNaN(v)) set(Math.min(Math.max(v, min), max));
            }}
            className="w-24 text-right text-sm font-bold text-ds-text-primary bg-ds-bg-tertiary border border-ds-border-default rounded-lg px-2 py-1 focus:outline-none focus:border-ds-border-accent"
          />
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => set(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none bg-ds-bg-surface cursor-pointer accent-[var(--ds-accent-primary)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--ds-accent-primary)] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab"
      />
      <div className="flex justify-between mt-1 text-[10px] text-ds-text-muted">
        <span>{fmt(min)}</span>
        <span>{fmt(max)}</span>
      </div>
    </div>
  );

  const ResultCard = ({ label, value, color, subtitle }: { label: string; value: string; color?: string; subtitle?: string }) => (
    <div className="glass rounded-xl p-4 text-center">
      <p className="text-xs text-ds-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${color || "text-ds-text-primary"}`}>{value}</p>
      {subtitle && <p className="text-[10px] text-ds-text-muted mt-0.5">{subtitle}</p>}
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-text-primary flex items-center gap-2">
            <Calculator className="h-6 w-6 text-ds-text-accent" />Mortgage Calculator
          </h1>
          <p className="text-sm text-ds-text-secondary mt-1">Calculate payments, stamp duty, and compare scenarios.</p>
        </div>
        <button onClick={() => setShowCompare(!showCompare)} className="text-xs text-ds-text-accent hover:underline">
          {showCompare ? "Hide comparison" : "Compare scenarios"}
        </button>
      </div>

      {/* Buyer Type Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {BUYER_TYPES.map((bt) => {
          const Icon = bt.icon;
          return (
            <button
              key={bt.value}
              onClick={() => setBuyerType(bt.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl px-3 py-4 border-2 transition-all text-center",
                buyerType === bt.value
                  ? "border-ds-accent-primary bg-ds-accent-primary/10"
                  : "border-ds-border-default hover:border-ds-border-strong"
              )}
            >
              <Icon className={cn("h-5 w-5", buyerType === bt.value ? "text-ds-text-accent" : "text-ds-text-muted")} />
              <span className={cn("text-xs font-semibold", buyerType === bt.value ? "text-ds-text-accent" : "text-ds-text-primary")}>{bt.label}</span>
              <span className="text-[10px] text-ds-text-muted">{bt.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Mortgage Type */}
      <div className="flex gap-3">
        {MORTGAGE_TYPES.map((mt) => (
          <button
            key={mt.value}
            onClick={() => setMortgageType(mt.value)}
            className={cn(
              "flex-1 rounded-lg px-4 py-3 border-2 transition-all text-left",
              mortgageType === mt.value
                ? "border-ds-accent-primary bg-ds-accent-primary/5"
                : "border-ds-border-default hover:border-ds-border-strong"
            )}
          >
            <span className={cn("text-sm font-semibold block", mortgageType === mt.value ? "text-ds-text-accent" : "text-ds-text-primary")}>{mt.label}</span>
            <span className="text-xs text-ds-text-muted">{mt.desc}</span>
          </button>
        ))}
      </div>

      {/* Stamp duty info banner */}
      {buyerType === "first_time" && pv <= 425000 && (
        <div className="flex items-center gap-2 rounded-lg bg-ds-feedback-success/10 border border-ds-feedback-success/20 px-4 py-2.5">
          <Info className="h-4 w-4 text-ds-feedback-success shrink-0" />
          <p className="text-xs text-ds-feedback-success font-medium">First-time buyer relief: £0 stamp duty on properties up to £425,000</p>
        </div>
      )}
      {buyerType === "first_time" && pv > 425000 && pv <= 625000 && (
        <div className="flex items-center gap-2 rounded-lg bg-ds-accent-primary/10 border border-ds-accent-primary/20 px-4 py-2.5">
          <Info className="h-4 w-4 text-ds-text-accent shrink-0" />
          <p className="text-xs text-ds-text-accent font-medium">First-time buyer: 5% on the portion above £425,000 only (saving you {formatPounds(calcStampDuty(pv, "home_mover") - calcStampDuty(pv, "first_time"))} vs standard rates)</p>
        </div>
      )}
      {buyerType === "additional" && (
        <div className="flex items-center gap-2 rounded-lg bg-ds-feedback-warning/10 border border-ds-feedback-warning/20 px-4 py-2.5">
          <Info className="h-4 w-4 text-ds-feedback-warning shrink-0" />
          <p className="text-xs text-ds-feedback-warning font-medium">Additional property: 3% surcharge applies on top of standard rates (extra {formatPounds(pv * 0.03)})</p>
        </div>
      )}

      <div className={`grid grid-cols-1 ${showCompare ? "lg:grid-cols-2" : ""} gap-6`}>
        <Card variant="glass">
          <h2 className="text-lg font-semibold text-ds-text-primary mb-6">{showCompare ? "Scenario A" : "Your Mortgage"}</h2>
          <div className="space-y-5">
            <SliderRow label="Property Value" value={pv} set={setPv} min={50000} max={2000000} step={5000} fmt={formatPounds} />
            <SliderRow label="Deposit" value={Math.min(dep, pv)} set={setDep} min={0} max={pv} step={1000} fmt={formatPounds} />
            <SliderRow label="Term" value={term} set={setTerm} min={5} max={40} step={1} fmt={(v) => `${v} years`} />
            <SliderRow label="Interest Rate" value={rate} set={setRate} min={1} max={10} step={0.1} fmt={(v) => `${v.toFixed(1)}%`} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <ResultCard label="Monthly Payment" value={formatPounds(r1.monthlyPayment)} color="text-ds-accent-primary" subtitle={`${formatPounds(r1.monthlyPayment * 12)}/year`} />
            <ResultCard label="LTV Ratio" value={`${r1.ltv.toFixed(1)}%`} subtitle={r1.ltv <= 60 ? "Best rates" : r1.ltv <= 75 ? "Good rates" : r1.ltv <= 90 ? "Standard rates" : "High LTV"} />
            <ResultCard label="Total Interest" value={formatPounds(r1.totalInterest)} color="text-ds-feedback-warning" />
            <ResultCard label="Stamp Duty" value={formatPounds(r1.stampDuty)} color={r1.stampDuty === 0 ? "text-ds-feedback-success" : "text-ds-accent-secondary"} subtitle={r1.stampDuty === 0 ? "£0 — tax free!" : undefined} />
          </div>
          {mortgageType === "interest_only" && (
            <div className="mt-3 rounded-lg bg-ds-feedback-warning/10 border border-ds-feedback-warning/20 px-3 py-2">
              <p className="text-[11px] text-ds-feedback-warning">Interest only: you will still owe {formatPounds(r1.loanAmount)} at the end of the term</p>
            </div>
          )}
        </Card>

        {showCompare && (
          <Card variant="glass">
            <h2 className="text-lg font-semibold text-ds-text-primary mb-6">Scenario B</h2>
            <div className="space-y-5">
              <SliderRow label="Property Value" value={pv2} set={setPv2} min={50000} max={2000000} step={5000} fmt={formatPounds} />
              <SliderRow label="Deposit" value={Math.min(dep2, pv2)} set={setDep2} min={0} max={pv2} step={1000} fmt={formatPounds} />
              <SliderRow label="Term" value={term2} set={setTerm2} min={5} max={40} step={1} fmt={(v) => `${v} years`} />
              <SliderRow label="Interest Rate" value={rate2} set={setRate2} min={1} max={10} step={0.1} fmt={(v) => `${v.toFixed(1)}%`} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <ResultCard label="Monthly Payment" value={formatPounds(r2.monthlyPayment)} color="text-ds-accent-primary" />
              <ResultCard label="LTV Ratio" value={`${r2.ltv.toFixed(1)}%`} />
              <ResultCard label="Total Interest" value={formatPounds(r2.totalInterest)} color="text-ds-feedback-warning" />
              <ResultCard label="Stamp Duty" value={formatPounds(r2.stampDuty)} color={r2.stampDuty === 0 ? "text-ds-feedback-success" : "text-ds-accent-secondary"} />
            </div>
          </Card>
        )}
      </div>

      {showCompare && (
        <Card variant="glass">
          <h3 className="text-sm font-semibold text-ds-text-primary mb-4">Comparison Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ds-border-default">
                  <th className="py-2 text-left text-ds-text-muted">Metric</th>
                  <th className="py-2 text-right text-ds-text-muted">Scenario A</th>
                  <th className="py-2 text-right text-ds-text-muted">Scenario B</th>
                  <th className="py-2 text-right text-ds-text-muted">Difference</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Monthly Payment", r1.monthlyPayment, r2.monthlyPayment],
                  ["Total Interest", r1.totalInterest, r2.totalInterest],
                  ["Total Cost", r1.totalCost, r2.totalCost],
                  ["Stamp Duty", r1.stampDuty, r2.stampDuty],
                ].map(([l, a, b]) => (
                  <tr key={l as string} className="border-b border-ds-border-default/50">
                    <td className="py-2 text-ds-text-secondary">{l as string}</td>
                    <td className="py-2 text-right text-ds-text-primary">{formatPounds(a as number)}</td>
                    <td className="py-2 text-right text-ds-text-primary">{formatPounds(b as number)}</td>
                    <td className={`py-2 text-right font-medium ${(a as number) > (b as number) ? "text-ds-feedback-error" : "text-ds-feedback-success"}`}>
                      {formatPounds(Math.abs((a as number) - (b as number)))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card variant="glass">
        <h3 className="text-sm font-semibold text-ds-text-primary mb-4">Repayment Schedule</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={schedule}>
              <XAxis dataKey="year" tick={{ fill: "var(--ds-text-muted)", fontSize: 11 }} axisLine={{ stroke: "var(--ds-border-default)" }} tickLine={false} />
              <YAxis tick={{ fill: "var(--ds-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "var(--ds-bg-secondary)", border: "1px solid var(--ds-border-default)", borderRadius: "8px", color: "var(--ds-text-primary)", fontSize: "12px" }} />
              <Line type="monotone" dataKey="balance" stroke="#059669" strokeWidth={2} dot={false} name="Balance" />
              <Line type="monotone" dataKey="paid" stroke="#D97706" strokeWidth={2} dot={false} name="Total Paid" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Stamp Duty Breakdown */}
      <Card variant="glass">
        <h3 className="text-sm font-semibold text-ds-text-primary mb-4">Stamp Duty Breakdown — {BUYER_TYPES.find(b => b.value === buyerType)?.label}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ds-border-default">
                <th className="py-2 text-left text-ds-text-muted">Band</th>
                <th className="py-2 text-right text-ds-text-muted">Rate</th>
                <th className="py-2 text-right text-ds-text-muted">Tax</th>
              </tr>
            </thead>
            <tbody>
              {buyerType === "first_time" && pv <= 425000 ? (
                <tr className="border-b border-ds-border-default/50">
                  <td className="py-2 text-ds-text-secondary">Up to £425,000</td>
                  <td className="py-2 text-right text-ds-feedback-success font-medium">0%</td>
                  <td className="py-2 text-right text-ds-feedback-success font-bold">£0</td>
                </tr>
              ) : buyerType === "first_time" && pv <= 625000 ? (
                <>
                  <tr className="border-b border-ds-border-default/50">
                    <td className="py-2 text-ds-text-secondary">Up to £425,000</td>
                    <td className="py-2 text-right">0%</td>
                    <td className="py-2 text-right">£0</td>
                  </tr>
                  <tr className="border-b border-ds-border-default/50">
                    <td className="py-2 text-ds-text-secondary">£425,001 to {formatPounds(pv)}</td>
                    <td className="py-2 text-right">5%</td>
                    <td className="py-2 text-right">{formatPounds((pv - 425000) * 0.05)}</td>
                  </tr>
                </>
              ) : (
                <>
                  <tr className="border-b border-ds-border-default/50">
                    <td className="py-2 text-ds-text-secondary">Up to £250,000</td>
                    <td className="py-2 text-right">0%</td>
                    <td className="py-2 text-right">£0</td>
                  </tr>
                  {pv > 250000 && (
                    <tr className="border-b border-ds-border-default/50">
                      <td className="py-2 text-ds-text-secondary">£250,001 to £925,000</td>
                      <td className="py-2 text-right">5%</td>
                      <td className="py-2 text-right">{formatPounds(Math.min(pv - 250000, 675000) * 0.05)}</td>
                    </tr>
                  )}
                  {pv > 925000 && (
                    <tr className="border-b border-ds-border-default/50">
                      <td className="py-2 text-ds-text-secondary">£925,001 to £1,500,000</td>
                      <td className="py-2 text-right">10%</td>
                      <td className="py-2 text-right">{formatPounds(Math.min(pv - 925000, 575000) * 0.10)}</td>
                    </tr>
                  )}
                  {buyerType === "additional" && (
                    <tr className="border-b border-ds-border-default/50">
                      <td className="py-2 text-ds-text-secondary font-medium">Additional property surcharge</td>
                      <td className="py-2 text-right text-ds-feedback-warning font-medium">+3%</td>
                      <td className="py-2 text-right text-ds-feedback-warning font-medium">{formatPounds(pv * 0.03)}</td>
                    </tr>
                  )}
                </>
              )}
              <tr className="font-bold">
                <td className="py-2 text-ds-text-primary">Total Stamp Duty</td>
                <td className="py-2"></td>
                <td className="py-2 text-right text-ds-text-primary">{formatPounds(r1.stampDuty)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
