import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { COMPANY } from "@/config/company";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ds-bg-primary"><Header /><div className="pt-24 pb-16"><div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-ds-text-primary mb-2">Privacy Policy</h1><p className="text-sm text-ds-text-muted mb-10">Last updated: 23 November 2026</p>
      <div className="space-y-8 text-sm text-ds-text-secondary leading-relaxed">
        <section><h2 className="text-lg font-semibold text-ds-text-primary mb-3">1. Introduction</h2><p>AI Mortgage Adviser is committed to protecting your privacy. This policy explains how we collect, use, and store your data.</p><p className="mt-3">AI Mortgage Adviser is run by {COMPANY.name}, the data controller for your personal data: a company registered in England and Wales, number {COMPANY.number}, registered office {COMPANY.address}.</p></section>
        <section><h2 className="text-lg font-semibold text-ds-text-primary mb-3">2. Data We Collect</h2><ul className="list-disc pl-5 space-y-2"><li><strong className="text-ds-text-primary">Account info:</strong> Name, email, hashed password.</li><li><strong className="text-ds-text-primary">Financial documents:</strong> Payslips, bank statements, ID uploaded for analysis.</li><li><strong className="text-ds-text-primary">Chat history:</strong> Conversations with the AI adviser.</li><li><strong className="text-ds-text-primary">Payment info:</strong> Processed securely by Stripe. We do not store card details.</li></ul></section>
        <section><h2 className="text-lg font-semibold text-ds-text-primary mb-3">3. How We Use Your Data</h2><ul className="list-disc pl-5 space-y-2"><li>To assess mortgage affordability and eligibility.</li><li>To match you with suitable lenders.</li><li>To generate personalised mortgage strategies.</li><li>To process payments and manage your account.</li></ul></section>
        <section><h2 className="text-lg font-semibold text-ds-text-primary mb-3">4. Your Rights (GDPR)</h2><p>You have the right to access, rectify, erase, restrict, and port your data. Email <a href={`mailto:${COMPANY.email}`} className="text-ds-text-accent hover:underline">{COMPANY.email}</a>. You can also complain to the Information Commissioner’s Office (ico.org.uk, 0303 123 1113).</p></section>
        <section><h2 className="text-lg font-semibold text-ds-text-primary mb-3">5. Data Storage</h2><p>Your account, chat history and analysis results are stored in our database on Amazon Web Services (AWS) servers in the USA (us-east-1). Uploaded documents are stored on AWS S3 in the EU (Frankfurt, eu-central-1). Data travels over HTTPS, and access to it is restricted to us.</p></section>
        <section><h2 className="text-lg font-semibold text-ds-text-primary mb-3">6. Who We Share It With</h2><p>We do not sell your data. We share it only with Stripe (payments), AWS (hosting and storage) and OpenAI, which processes your questions and documents to produce the AI answers, and when the law requires it. AWS and OpenAI process data in the USA; these transfers are covered by the UK Extension to the EU–US Data Privacy Framework or the UK International Data Transfer Addendum to the providers’ standard contractual clauses.</p></section>
      </div>
    </div></div><Footer /></div>
  );
}
