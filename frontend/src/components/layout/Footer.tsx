import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-ds-border-default bg-ds-bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-ds-text-primary">AI Mortgage Adviser</span>
            </div>
            <p className="text-sm text-ds-text-muted max-w-md leading-relaxed">
              AI-powered mortgage advice for UK homebuyers. Get expert guidance powered by artificial
              intelligence to find the best mortgage deal for your situation.
            </p>
            <p className="mt-4 text-xs text-ds-text-muted leading-relaxed">
              Disclaimer: AI Mortgage Adviser provides AI-generated guidance for informational purposes
              only. This does not constitute professional mortgage or financial advice. Always consult a
              qualified mortgage broker or financial adviser before making property decisions.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ds-text-primary mb-4">Product</h3>
            <ul className="space-y-2.5">
              <li><a href="#features" className="text-sm text-ds-text-muted hover:text-ds-text-primary transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm text-ds-text-muted hover:text-ds-text-primary transition-colors">Pricing</a></li>
              <li><a href="#how-it-works" className="text-sm text-ds-text-muted hover:text-ds-text-primary transition-colors">How It Works</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ds-text-primary mb-4">Legal</h3>
            <ul className="space-y-2.5">
              <li><Link to="/terms" className="text-sm text-ds-text-muted hover:text-ds-text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-sm text-ds-text-muted hover:text-ds-text-primary transition-colors">Privacy Policy</Link></li>
              <li><a href="mailto:support@aimortgage.co.uk" className="text-sm text-ds-text-muted hover:text-ds-text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-ds-border-default pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ds-text-muted">&copy; {new Date().getFullYear()} AI Mortgage Adviser. All rights reserved.</p>
          <p className="text-xs text-ds-text-muted">Made in the UK. Not a substitute for professional advice.</p>
        </div>
      </div>
    </footer>
  );
}
