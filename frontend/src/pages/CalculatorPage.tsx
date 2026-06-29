import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatPounds } from "@/utils/format";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function calcMortgage(propertyValue: number, deposit: number, termYears: number, rate: number) {
  const loan = propertyValue - deposit; const mr = rate / 100 / 12; const np = termYears * 12;
  const mp = mr > 0 ? (loan * mr * Math.pow(1 + mr, np)) / (Math.pow(1 + mr, np) - 1) : loan / np;
  const total = mp * np; const interest = total - loan; const ltv = (loan / propertyValue) * 100;
  let stamp = 0;
  if (propertyValue > 250000) { stamp += Math.min(propertyValue - 250000, 675000) * 0.05; if (propertyValue > 925000) stamp += Math.min(propertyValue - 925000, 575000) * 0.10; if (propertyValue > 1500000) stamp += (propertyValue - 1500000) * 0.12; }
  return { monthlyPayment: mp, totalInterest: interest, totalCost: total, ltv, stampDuty: stamp, loanAmount: loan };
}

function generateSchedule(loan: number, rate: number, termYears: number) {
  const mr = rate / 100 / 12; const np = termYears * 12;
  const mp = mr > 0 ? (loan * mr * Math.pow(1 + mr, np)) / (Math.pow(1 + mr, np) - 1) : loan / np;
  const data: { year: number; balance: number; paid: number }[] = [];
  let balance = loan; let totalPaid = 0;
  for (let y = 0; y <= termYears; y++) {
    data.push({ year: y, balance: Math.round(balance), paid: Math.round(totalPaid) });
    for (let m = 0; m < 12 && balance > 0; m++) { const interest = balance * mr; const principal = mp - interest; balance = Math.max(0, balance - principal); totalPaid += mp; }
  }
  return data;
}

export function CalculatorPage() {
  const [pv, setPv] = useState(300000); const [dep, setDep] = useState(30000); const [term, setTerm] = useState(25); const [rate, setRate] = useState(4.5);
  const [pv2, setPv2] = useState(300000); const [dep2, setDep2] = useState(60000); const [term2, setTerm2] = useState(30); const [rate2, setRate2] = useState(3.9);
  const [showCompare, setShowCompare] = useState(false);

  const r1 = useMemo(() => calcMortgage(pv, Math.min(dep, pv), term, rate), [pv, dep, term, rate]);
  const r2 = useMemo(() => calcMortgage(pv2, Math.min(dep2, pv2), term2, rate2), [pv2, dep2, term2, rate2]);
  const schedule = useMemo(() => generateSchedule(r1.loanAmount, rate, term), [r1.loanAmount, rate, term]);

  const SliderRow = ({ label, value, set, min, max, step, fmt }: { label: string; value: number; set: (v: number) => void; min: number; max: number; step: number; fmt: (v: number) => string }) => (
    <div>
      <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium text-ds-text-secondary">{label}</label><span className="text-lg font-bold text-ds-text-primary">{fmt(value)}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className="w-full h-1.5 rounded-full appearance-none bg-ds-bg-surface cursor-pointer accent-[var(--ds-accent-primary)] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--ds-accent-primary)]" />
    </div>
  );

  const ResultCard = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <div className="glass rounded-xl p-4 text-center"><p className="text-xs text-ds-text-muted uppercase tracking-wider mb-1">{label}</p><p className={`text-xl font-bold ${color || "text-ds-text-primary"}`}>{value}</p></div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ds-text-primary flex items-center gap-2"><Calculator className="h-6 w-6 text-ds-text-accent" />Mortgage Calculator</h1><p className="text-sm text-ds-text-secondary mt-1">Calculate payments, compare scenarios, and view repayment schedules.</p></div>
        <button onClick={() => setShowCompare(!showCompare)} className="text-xs text-ds-text-accent hover:underline">{showCompare ? "Hide comparison" : "Compare scenarios"}</button>
      </div>

      <div className={`grid grid-cols-1 ${showCompare ? "lg:grid-cols-2" : ""} gap-6`}>
        <Card variant="glass"><h2 className="text-lg font-semibold text-ds-text-primary mb-6">{showCompare ? "Scenario A" : "Your Mortgage"}</h2>
          <div className="space-y-5">
            <SliderRow label="Property Value" value={pv} set={setPv} min={50000} max={2000000} step={5000} fmt={formatPounds} />
            <SliderRow label="Deposit" value={Math.min(dep, pv)} set={setDep} min={0} max={pv} step={1000} fmt={formatPounds} />
            <SliderRow label="Term" value={term} set={setTerm} min={5} max={40} step={1} fmt={(v) => `${v} years`} />
            <SliderRow label="Interest Rate" value={rate} set={setRate} min={1} max={10} step={0.1} fmt={(v) => `${v.toFixed(2)}%`} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <ResultCard label="Monthly Payment" value={formatPounds(r1.monthlyPayment)} color="text-ds-accent-primary" />
            <ResultCard label="LTV Ratio" value={`${r1.ltv.toFixed(1)}%`} />
            <ResultCard label="Total Interest" value={formatPounds(r1.totalInterest)} color="text-ds-feedback-warning" />
            <ResultCard label="Stamp Duty" value={formatPounds(r1.stampDuty)} color="text-ds-accent-secondary" />
          </div>
        </Card>

        {showCompare && (
          <Card variant="glass"><h2 className="text-lg font-semibold text-ds-text-primary mb-6">Scenario B</h2>
            <div className="space-y-5">
              <SliderRow label="Property Value" value={pv2} set={setPv2} min={50000} max={2000000} step={5000} fmt={formatPounds} />
              <SliderRow label="Deposit" value={Math.min(dep2, pv2)} set={setDep2} min={0} max={pv2} step={1000} fmt={formatPounds} />
              <SliderRow label="Term" value={term2} set={setTerm2} min={5} max={40} step={1} fmt={(v) => `${v} years`} />
              <SliderRow label="Interest Rate" value={rate2} set={setRate2} min={1} max={10} step={0.1} fmt={(v) => `${v.toFixed(2)}%`} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <ResultCard label="Monthly Payment" value={formatPounds(r2.monthlyPayment)} color="text-ds-accent-primary" />
              <ResultCard label="LTV Ratio" value={`${r2.ltv.toFixed(1)}%`} />
              <ResultCard label="Total Interest" value={formatPounds(r2.totalInterest)} color="text-ds-feedback-warning" />
              <ResultCard label="Stamp Duty" value={formatPounds(r2.stampDuty)} color="text-ds-accent-secondary" />
            </div>
          </Card>
        )}
      </div>

      {showCompare && (
        <Card variant="glass"><h3 className="text-sm font-semibold text-ds-text-primary mb-4">Comparison Summary</h3>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-ds-border-default"><th className="py-2 text-left text-ds-text-muted">Metric</th><th className="py-2 text-right text-ds-text-muted">Scenario A</th><th className="py-2 text-right text-ds-text-muted">Scenario B</th><th className="py-2 text-right text-ds-text-muted">Difference</th></tr></thead>
            <tbody>{[["Monthly", r1.monthlyPayment, r2.monthlyPayment], ["Total Interest", r1.totalInterest, r2.totalInterest], ["Total Cost", r1.totalCost, r2.totalCost]].map(([l, a, b]) => (
              <tr key={l as string} className="border-b border-ds-border-default/50"><td className="py-2 text-ds-text-secondary">{l as string}</td><td className="py-2 text-right text-ds-text-primary">{formatPounds(a as number)}</td><td className="py-2 text-right text-ds-text-primary">{formatPounds(b as number)}</td><td className={`py-2 text-right font-medium ${(a as number) > (b as number) ? "text-ds-feedback-error" : "text-ds-feedback-success"}`}>{formatPounds(Math.abs((a as number) - (b as number)))}</td></tr>
            ))}</tbody></table></div>
        </Card>
      )}

      <Card variant="glass"><h3 className="text-sm font-semibold text-ds-text-primary mb-4">Repayment Schedule</h3>
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
    </div>
  );
}
