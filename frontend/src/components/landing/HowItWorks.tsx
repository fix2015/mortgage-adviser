import { motion } from "framer-motion";
import { UserCircle, Upload, Brain, Landmark, ArrowRight } from "lucide-react";

const steps = [
  { icon: UserCircle, title: "Tell Us About You", description: "Answer a few questions about your income, deposit, and property goals.", color: "from-emerald-500 to-emerald-600" },
  { icon: Upload, title: "Upload Documents", description: "Share payslips, bank statements, and ID for a thorough assessment.", color: "from-amber-500 to-amber-600" },
  { icon: Brain, title: "AI Analyses", description: "Our AI evaluates your profile against 50+ lenders to find the best match.", color: "from-teal-500 to-teal-600" },
  { icon: Landmark, title: "Get Matched", description: "Receive personalised lender recommendations with rates, fees, and approval odds.", color: "from-green-500 to-green-600" },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-ds-text-primary">How It Works</h2>
          <p className="mt-4 text-lg text-ds-text-secondary max-w-2xl mx-auto">
            Four simple steps to finding your perfect mortgage. Takes less than 15 minutes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div key={step.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.15 }} className="relative group">
              <div className="glass rounded-2xl p-6 h-full hover:border-ds-border-strong transition-all duration-300 hover:-translate-y-1">
                <div className="absolute -top-3 -left-1 flex h-7 w-7 items-center justify-center rounded-full bg-ds-bg-primary border border-ds-border-strong text-xs font-bold text-ds-text-accent">{i + 1}</div>
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} shadow-lg`}>
                  <step.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-ds-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-ds-text-secondary leading-relaxed">{step.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-3 z-10 -translate-y-1/2">
                  <ArrowRight className="h-5 w-5 text-ds-text-muted" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
