import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ds-bg-primary"><Header /><div className="pt-24 pb-16"><div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-ds-text-primary mb-2">Privacy Policy</h1><p className="text-sm text-ds-text-muted mb-10">Last updated: January 2026</p>
      <div className="space-y-8 text-sm text-ds-text-secondary leading-relaxed">
        <section><h2 className="text-lg font-semibold text-ds-text-primary mb-3">1. Introduction</h2><p>AI Mortgage Adviser is committed to protecting your privacy. This policy explains how we collect, use, and store your data.</p></section>
        <section><h2 className="text-lg font-semibold text-ds-text-primary mb-3">2. Data We Collect</h2><ul className="list-disc pl-5 space-y-2"><li><strong className="text-ds-text-primary">Account info:</strong> Name, email, hashed password.</li><li><strong className="text-ds-text-primary">Financial documents:</strong> Payslips, bank statements, ID uploaded for analysis.</li><li><strong className="text-ds-text-primary">Chat history:</strong> Conversations with the AI adviser.</li><li><strong className="text-ds-text-primary">Payment info:</strong> Processed securely by Stripe.</li></ul></section>
        <section><h2 className="text-lg font-semibold text-ds-text-primary mb-3">3. How We Use Your Data</h2><ul className="list-disc pl-5 space-y-2"><li>To assess mortgage affordability and eligibility.</li><li>To match you with suitable lenders.</li><li>To generate personalised mortgage strategies.</li><li>To process payments and manage your account.</li></ul></section>
        <section><h2 className="text-lg font-semibold text-ds-text-primary mb-3">4. Your Rights (GDPR)</h2><p>You have the right to access, rectify, erase, restrict, and port your data. Contact <a href="mailto:privacy@aimortgage.co.uk" className="text-ds-text-accent hover:underline">privacy@aimortgage.co.uk</a>.</p></section>
        <section><h2 className="text-lg font-semibold text-ds-text-primary mb-3">5. Data Storage</h2><p>Data is stored encrypted on AWS EU-West-2 (London) using AES-256 encryption and TLS 1.3.</p></section>
      </div>
    </div></div><Footer /></div>
  );
}
