import { useState } from "react";
import { motion } from "framer-motion";
import { FileSignature, Copy, Download, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getEmployerReference } from "@/api/chat";

export function ReferencePage() {
  const [letterText, setLetterText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setLetterText("");
    try {
      const result = await getEmployerReference();
      setLetterText(result.letter_text);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr?.response?.data?.detail || "Failed to generate reference letter. Please ensure you have uploaded employment documents.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(letterText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignored */ }
  };

  const handleDownloadPDF = () => {
    // Create a simple text file download (printable as PDF from browser)
    const blob = new Blob([letterText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employer_reference_draft.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 h-full overflow-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20">
          <FileSignature className="h-6 w-6 text-ds-text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ds-text-primary">Employer Reference Letter</h1>
          <p className="text-sm text-ds-text-secondary mt-0.5">Auto-generate a draft reference letter for your mortgage application</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-ds-accent-secondary/30 bg-ds-accent-secondary/5 px-4 py-3 text-sm text-ds-text-secondary flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-ds-accent-secondary shrink-0 mt-0.5" />
        <p>
          This generates a <strong>draft</strong> based on your uploaded payslips and contracts.
          Give it to your employer to review, adjust, and sign on company letterhead before submitting to your lender.
        </p>
      </div>

      {!letterText && (
        <Card className="text-center py-12">
          <FileSignature className="h-12 w-12 mx-auto mb-4 text-ds-text-muted" />
          <h3 className="text-lg font-bold text-ds-text-primary mb-2">Generate Employer Reference</h3>
          <p className="text-sm text-ds-text-secondary max-w-md mx-auto mb-6">
            We will analyse your uploaded payslips, contracts, and employment documents to draft
            a professional employer reference letter suitable for UK mortgage lenders.
          </p>
          <Button
            variant="glow"
            size="lg"
            onClick={handleGenerate}
            isLoading={loading}
            leftIcon={loading ? undefined : <FileSignature className="h-5 w-5" />}
          >
            {loading ? "Generating..." : "Generate Reference Letter"}
          </Button>
          {error && (
            <div className="mt-4 rounded-lg border border-ds-feedback-error/30 bg-ds-feedback-error/10 px-4 py-3 text-sm text-ds-feedback-error max-w-md mx-auto">
              {error}
            </div>
          )}
        </Card>
      )}

      {loading && !letterText && (
        <Card className="text-center py-8">
          <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-ds-text-accent" />
          <p className="text-sm text-ds-text-secondary">Analysing your documents and drafting the letter...</p>
        </Card>
      )}

      {letterText && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={copied ? <CheckCircle2 className="h-4 w-4" style={{ color: "#059669" }} /> : <Copy className="h-4 w-4" />}
              onClick={handleCopy}
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleDownloadPDF}
            >
              Download as Text
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              isLoading={loading}
            >
              Regenerate
            </Button>
          </div>

          {/* Letter preview */}
          <Card className="relative">
            {/* Simulated letterhead styling */}
            <div className="border-2 border-ds-border-default rounded-lg p-8 bg-white min-h-[600px]">
              <div className="prose prose-sm max-w-none text-ds-text-primary whitespace-pre-wrap font-serif leading-relaxed text-[13px]">
                {letterText}
              </div>
            </div>
          </Card>

          {/* Reminder */}
          <div className="rounded-xl border border-ds-feedback-warning/30 bg-ds-feedback-warning/5 px-4 py-3 text-xs text-ds-text-secondary flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-ds-feedback-warning shrink-0 mt-0.5" />
            <p>
              <strong>Important:</strong> This is an AI-generated draft. Your employer must review the content,
              make any necessary corrections, print it on official company letterhead, and sign it before
              it can be submitted to a mortgage lender.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
