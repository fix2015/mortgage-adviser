import { motion } from "framer-motion";
import { Building2, TrendingDown, Target } from "lucide-react";

const stats = [
  { icon: Building2, value: "50+", label: "UK lenders compared" },
  { icon: TrendingDown, value: "£2,400", label: "Average annual savings" },
  { icon: Target, value: "97%", label: "Approval prediction accuracy" },
];

export function Stats() {
  return (
    <section className="relative py-16 border-y border-ds-border-default/50">
      <div className="absolute inset-0 bg-gradient-to-r from-ds-accent-primary/5 via-transparent to-ds-accent-secondary/5" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.15 }}
              className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-ds-accent-primary/10 border border-ds-accent-primary/20">
                <stat.icon className="h-6 w-6 text-ds-text-accent" />
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-gradient">{stat.value}</p>
              <p className="mt-1 text-sm text-ds-text-secondary">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
