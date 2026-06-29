import { motion } from "framer-motion";
import { Calculator, FileSearch, GitBranch, FileDown, MessageSquare, Landmark } from "lucide-react";

const features = [
  { icon: Calculator, title: "Mortgage Calculator", description: "Calculate monthly payments, total interest, stamp duty, and LTV ratio instantly with interactive sliders." },
  { icon: FileSearch, title: "Document Analysis", description: "Upload payslips, bank statements, and ID. Our AI verifies affordability and flags potential issues." },
  { icon: GitBranch, title: "Knowledge Graph", description: "See how your financial profile connects to lender requirements in an interactive knowledge graph." },
  { icon: FileDown, title: "Strategy Report PDF", description: "Get a professional mortgage strategy document to share with estate agents or brokers." },
  { icon: MessageSquare, title: "AI Chat Consultation", description: "Ask anything about mortgages, rates, Help to Buy, shared ownership, or buy-to-let." },
  { icon: Landmark, title: "Lender Matching", description: "AI compares 50+ UK lenders and recommends the best deals for your exact situation." },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 bg-ds-bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-ds-text-primary">
            Everything You Need for <span className="text-gradient">Smarter Mortgages</span>
          </h2>
          <p className="mt-4 text-lg text-ds-text-secondary max-w-2xl mx-auto">
            Powerful AI tools to help UK homebuyers find the perfect mortgage deal.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="group">
              <div className="glass rounded-2xl p-6 h-full hover:border-ds-accent-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-ds-accent-primary/5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-ds-accent-primary/10 border border-ds-accent-primary/20 group-hover:bg-ds-accent-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-ds-text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-ds-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-ds-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
