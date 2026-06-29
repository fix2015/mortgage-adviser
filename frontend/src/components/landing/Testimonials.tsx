import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  { name: "James & Sophie Taylor", role: "First-Time Buyers", content: "We had no idea where to start with mortgages. The AI walked us through everything and found us a rate 0.4% lower than our bank offered. Saved over £3,000 on our first home.", stars: 5, initials: "JT" },
  { name: "Mark Richardson", role: "Remortgager", content: "My fixed rate was ending and I was dreading the research. Uploaded my documents, got matched with the perfect lender in 10 minutes. Incredible value for £15.", stars: 5, initials: "MR" },
  { name: "Priya Sharma", role: "Buy-to-Let Investor", content: "Managing multiple properties means complex mortgage needs. The AI understood my portfolio and recommended specialist lenders I'd never heard of. My portfolio yield is up 12%.", stars: 5, initials: "PS" },
  { name: "David & Claire Hughes", role: "Moving Home", content: "The mortgage calculator alone was worth it. Being able to compare scenarios side-by-side helped us decide between a 2-year and 5-year fix. So clear and easy.", stars: 5, initials: "DH" },
  { name: "Emma Watkins", role: "Self-Employed Buyer", content: "As a freelancer, getting a mortgage felt impossible. The AI knew exactly which lenders accept self-employed applicants and what documents I needed. Approved in 3 weeks.", stars: 5, initials: "EW" },
  { name: "Ahmed Hassan", role: "Shared Ownership", content: "The Help to Buy and shared ownership options were explained so clearly. The strategy PDF was professional enough to show my housing association. Highly recommend.", stars: 5, initials: "AH" },
];

export function Testimonials() {
  return (
    <section className="relative py-24 bg-ds-bg-secondary/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-ds-text-primary">Trusted by UK Homebuyers</h2>
          <p className="mt-4 text-lg text-ds-text-secondary max-w-xl mx-auto">See what our clients say about their AI mortgage consultation.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
              <div className="glass rounded-2xl p-6 h-full hover:-translate-y-1 transition-transform duration-300">
                <div className="flex gap-1 mb-4">{Array.from({ length: t.stars }).map((_, j) => (<Star key={j} className="h-4 w-4 fill-ds-feedback-warning text-ds-feedback-warning" />))}</div>
                <p className="text-sm text-ds-text-secondary leading-relaxed mb-6">"{t.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary text-sm font-bold text-white">{t.initials}</div>
                  <div><p className="text-sm font-medium text-ds-text-primary">{t.name}</p><p className="text-xs text-ds-text-muted">{t.role}</p></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
