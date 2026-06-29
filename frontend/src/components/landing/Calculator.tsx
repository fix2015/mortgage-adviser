import { useState, useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Calculator as CalcIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPounds } from "@/utils/format";

function calcMortgage(propertyValue: number, deposit: number, termYears: number, rate: number) {
  const loanAmount = propertyValue - deposit;
  const ltv = loanAmount / propertyValue * 100;
  const monthlyRate = rate / 100 / 12;
  const numPayments = termYears * 12;
  const monthlyPayment = monthlyRate > 0
    ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    : loanAmount / numPayments;
  const totalCost = monthlyPayment * numPayments;
  const totalInterest = totalCost - loanAmount;

  // Stamp duty (England/Wales 2025/26)
  let stampDuty = 0;
  if (propertyValue > 250000) {
    stampDuty += Math.min(propertyValue - 250000, 675000) * 0.05;
    if (propertyValue > 925000) stampDuty += Math.min(propertyValue - 925000, 575000) * 0.10;
    if (propertyValue > 1500000) stampDuty += (propertyValue - 1500000) * 0.12;
  }

  return { monthlyPayment, totalInterest, totalCost, ltv, stampDuty, loanAmount };
}

export function Calculator() {
  const [propertyValue, setPropertyValue] = useState(300000);
  const [deposit, setDeposit] = useState(30000);
  const [term, setTerm] = useState(25);
  const [rate, setRate] = useState(4.5);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const result = useMemo(() => calcMortgage(propertyValue, Math.min(deposit, propertyValue), term, rate), [propertyValue, deposit, term, rate]);

  return (
    <section ref={sectionRef} id="calculator" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-ds-text-primary">
            Mortgage <span className="text-gradient">Calculator</span>
          </h2>
          <p className="mt-4 text-lg text-ds-text-secondary max-w-2xl mx-auto">
            See what you could pay monthly. Adjust the sliders and get instant results.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          className="glass-strong rounded-2xl p-6 sm:p-10 bg-glow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="space-y-6">
              {[
                { label: "Property Value", value: propertyValue, set: setPropertyValue, min: 50000, max: 2000000, step: 5000 },
                { label: "Deposit", value: Math.min(deposit, propertyValue), set: setDeposit, min: 0, max: propertyValue, step: 1000 },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-ds-text-secondary">{s.label}</label>
                    <span className="text-lg font-bold text-ds-text-primary">{formatPounds(s.value)}</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                    onChange={(e) => s.set(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-ds-bg-surface accent-[var(--ds-accent-primary)]" />
                  <div className="flex justify-between text-xs text-ds-text-muted mt-1">
                    <span>{formatPounds(s.min)}</span><span>{formatPounds(s.max)}</span>
                  </div>
                </div>
              ))}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-ds-text-secondary">Term (years)</label>
                  <span className="text-lg font-bold text-ds-text-primary">{term} years</span>
                </div>
                <input type="range" min={5} max={40} step={1} value={term} onChange={(e) => setTerm(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-ds-bg-surface accent-[var(--ds-accent-primary)]" />
                <div className="flex justify-between text-xs text-ds-text-muted mt-1"><span>5 years</span><span>40 years</span></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-ds-text-secondary">Interest Rate</label>
                  <span className="text-lg font-bold text-ds-text-primary">{rate.toFixed(2)}%</span>
                </div>
                <input type="range" min={1} max={10} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-ds-bg-surface accent-[var(--ds-accent-primary)]" />
                <div className="flex justify-between text-xs text-ds-text-muted mt-1"><span>1%</span><span>10%</span></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-text-muted uppercase tracking-wider mb-1">Monthly Payment</p>
                  <p className="text-2xl font-bold text-ds-accent-primary">{formatPounds(result.monthlyPayment)}</p>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-text-muted uppercase tracking-wider mb-1">LTV Ratio</p>
                  <p className="text-2xl font-bold text-ds-text-primary">{result.ltv.toFixed(1)}%</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-text-muted uppercase tracking-wider mb-1">Total Interest</p>
                  <p className="text-xl font-bold text-ds-feedback-warning">{formatPounds(result.totalInterest)}</p>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <p className="text-xs text-ds-text-muted uppercase tracking-wider mb-1">Total Cost</p>
                  <p className="text-xl font-bold text-ds-text-primary">{formatPounds(result.totalCost)}</p>
                </div>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <p className="text-xs text-ds-text-muted uppercase tracking-wider mb-1">Stamp Duty (England/Wales)</p>
                <p className="text-xl font-bold text-ds-accent-secondary">{formatPounds(result.stampDuty)}</p>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <p className="text-xs text-ds-text-muted uppercase tracking-wider mb-1">Loan Amount</p>
                <p className="text-xl font-bold text-ds-text-primary">{formatPounds(result.loanAmount)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <CalcIcon className="h-5 w-5 text-ds-text-accent" />
              <span className="text-sm text-ds-text-secondary">
                {result.ltv <= 60 ? "Excellent LTV - best rates available" : result.ltv <= 75 ? "Good LTV - competitive rates" : result.ltv <= 90 ? "Standard LTV - most lenders available" : "High LTV - limited lender choice"}
              </span>
            </div>
            <Link to="/register">
              <Button variant="glow" size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>Get Personalised Advice</Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-ds-text-muted text-center">
            Estimates based on UK 2025/26 rates. For illustrative purposes only.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
