import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Ghost } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ds-bg-primary px-4">
      <div className="absolute inset-0 overflow-hidden"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-ds-accent-primary/5 blur-[120px]" /></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-ds-bg-surface border border-ds-border-default mx-auto mb-6"><Ghost className="h-10 w-10 text-ds-text-muted" /></div>
        <h1 className="text-6xl font-bold text-gradient mb-4">404</h1>
        <h2 className="text-xl font-semibold text-ds-text-primary mb-2">Page Not Found</h2>
        <p className="text-sm text-ds-text-secondary mb-8 max-w-md">The page you are looking for does not exist or has been moved.</p>
        <Link to="/"><Button variant="glow" leftIcon={<ArrowLeft className="h-4 w-4" />}>Back to Home</Button></Link>
      </motion.div>
    </div>
  );
}
