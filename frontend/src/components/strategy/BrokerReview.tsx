import { useState } from "react";
import { motion } from "framer-motion";
import { UserCheck, CheckCircle, Clock, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createReviewCheckout } from "@/api/payments";
import { useToast } from "@/components/ui/Toast";

export function BrokerReview() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBookReview = async () => { setIsLoading(true); try { const url = await createReviewCheckout(); window.location.href = url; } catch { toast("error", "Failed to create checkout."); } finally { setIsLoading(false); } };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Card variant="glow" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-ds-accent-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 shrink-0"><UserCheck className="h-7 w-7 text-amber-400" /></div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1"><h2 className="text-lg font-bold text-ds-text-primary">Get a Professional Broker Review</h2><span className="text-xs font-medium text-amber-400 bg-amber-500/15 border border-amber-500/20 rounded-full px-2 py-0.5">Recommended</span></div>
              <p className="text-sm text-ds-text-secondary leading-relaxed max-w-xl">Get a qualified CeMAP mortgage broker to review your AI-generated strategy, verify affordability, and guide your application.</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[{ icon: Clock, text: "30-minute review by a qualified CeMAP broker" }, { icon: FileText, text: "Written feedback on your AI-generated strategy" }, { icon: CheckCircle, text: "Application guidance with next steps" }].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 rounded-lg bg-ds-bg-surface/50 border border-ds-border-default p-3"><Icon className="h-4 w-4 text-ds-feedback-success shrink-0 mt-0.5" /><span className="text-xs text-ds-text-secondary leading-relaxed">{text}</span></div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div><div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-ds-text-primary">£75</span><span className="text-sm text-ds-text-muted">one-time</span></div><p className="text-xs text-ds-text-muted mt-0.5">Includes full written report within 48 hours</p></div>
            <Button variant="glow" size="lg" onClick={handleBookReview} isLoading={isLoading} rightIcon={<ArrowRight className="h-4 w-4" />}>Book Broker Review</Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
