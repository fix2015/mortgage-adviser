import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Link } from "react-router-dom";

export function CookieConsent() {
  const [show, setShow] = useState(false);
  useEffect(() => { const c = localStorage.getItem("cookie_consent"); if (!c) { const t = setTimeout(() => setShow(true), 1500); return () => clearTimeout(t); } }, []);
  const handleAccept = () => { localStorage.setItem("cookie_consent", "accepted"); setShow(false); };
  const handleDecline = () => { localStorage.setItem("cookie_consent", "declined"); setShow(false); };

  return (
    <AnimatePresence>{show && (
      <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ duration: 0.4 }} className="fixed bottom-0 left-0 right-0 z-[60] p-4 sm:p-6">
        <div className="mx-auto max-w-4xl glass-strong rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-ds-accent-primary/10 border border-ds-accent-primary/20"><Cookie className="h-5 w-5 text-ds-text-accent" /></div>
            <div className="flex-1"><p className="text-sm text-ds-text-primary font-medium mb-1">We use cookies</p><p className="text-xs text-ds-text-secondary leading-relaxed">We use essential cookies to ensure our service works properly and analytical cookies to understand how you use our platform. See our <Link to="/privacy" className="text-ds-text-accent hover:underline">Privacy Policy</Link>.</p></div>
            <div className="flex items-center gap-3 flex-shrink-0"><Button variant="ghost" size="sm" onClick={handleDecline}>Decline</Button><Button variant="primary" size="sm" onClick={handleAccept}>Accept</Button></div>
          </div>
        </div>
      </motion.div>
    )}</AnimatePresence>
  );
}
