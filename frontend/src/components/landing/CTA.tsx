import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CTA() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-ds-accent-primary/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-ds-accent-secondary/10 blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-ds-text-primary">
            Ready to Find Your <span className="text-gradient">Dream Mortgage?</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ds-text-secondary leading-relaxed">
            Join thousands of UK homebuyers saving money with AI-powered mortgage advice. Start your consultation today for just £15.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button variant="glow" size="xl" rightIcon={<ArrowRight className="h-5 w-5" />}>Start Your Consultation</Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-ds-text-muted">Secure payment via Stripe. Your data is encrypted and stored safely.</p>
        </motion.div>
      </div>
    </section>
  );
}
