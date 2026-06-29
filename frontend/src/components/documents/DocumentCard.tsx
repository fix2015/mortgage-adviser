import { useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Trash2, CheckCircle, Loader2, AlertCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatFileSize, formatRelative } from "@/utils/format";
import type { Document } from "@/types";

interface DocumentCardProps {
  document: Document;
  onDelete: (id: number) => void;
  onRetry?: (id: number) => void;
  isDeleting?: boolean;
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string; animate?: boolean }> = {
  uploaded: { icon: CheckCircle, color: "text-ds-text-accent", label: "Uploaded" },
  processed: { icon: CheckCircle, color: "text-ds-feedback-success", label: "Processed" },
  processing: { icon: Loader2, color: "text-ds-feedback-warning", label: "Processing", animate: true },
  error: { icon: AlertCircle, color: "text-ds-feedback-error", label: "Error" },
};

const fileTypeIcons: Record<string, string> = {
  pdf: "bg-red-500/15 text-red-400",
  doc: "bg-blue-500/15 text-blue-400",
  docx: "bg-blue-500/15 text-blue-400",
  txt: "bg-gray-500/15 text-gray-400",
  csv: "bg-green-500/15 text-green-400",
  xlsx: "bg-green-500/15 text-green-400",
  xls: "bg-green-500/15 text-green-400",
};

const docTypeBadgeConfig: Record<string, { label: string; color: string; bg: string }> = {
  invoice: { label: "Invoice", color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/20" },
  bank_statement: { label: "Bank Statement", color: "text-green-400", bg: "bg-green-500/15 border-green-500/20" },
  tax_return: { label: "Tax Return", color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/20" },
  receipt: { label: "Receipt", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/20" },
  contract: { label: "Contract", color: "text-cyan-400", bg: "bg-cyan-500/15 border-cyan-500/20" },
  payslip: { label: "Payslip", color: "text-pink-400", bg: "bg-pink-500/15 border-pink-500/20" },
  other: { label: "Other", color: "text-gray-400", bg: "bg-gray-500/15 border-gray-500/20" },
};

interface StructuredData {
  key_data?: {
    total_amount?: string;
    date?: string;
    from?: string;
    to?: string;
    description?: string;
  };
  flags?: string[];
}

export function DocumentCard({ document, onDelete, onRetry, isDeleting }: DocumentCardProps) {
  const ext = document.filename.split(".").pop()?.toLowerCase() || "";
  const status = statusConfig[document.status];
  const StatusIcon = status.icon;

  const docTypeBadge = document.document_type ? docTypeBadgeConfig[document.document_type] || docTypeBadgeConfig.other : null;

  const structured = useMemo<StructuredData | null>(() => {
    if (!document.structured_data) return null;
    try {
      return JSON.parse(document.structured_data);
    } catch {
      return null;
    }
  }, [document.structured_data]);

  // Build a summary line from extracted key data
  const keyDataSummary = useMemo(() => {
    if (!structured?.key_data) return null;
    const parts: string[] = [];
    if (structured.key_data.total_amount) parts.push(structured.key_data.total_amount);
    if (structured.key_data.date) parts.push(structured.key_data.date);
    if (structured.key_data.from) parts.push(`From: ${structured.key_data.from}`);
    if (structured.key_data.to) parts.push(`To: ${structured.key_data.to}`);
    return parts.length > 0 ? parts.join(" \u2022 ") : null;
  }, [structured]);

  const flags = structured?.flags?.filter((f) => f && f.length > 0) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-4 rounded-xl border border-ds-border-default bg-ds-bg-tertiary p-4 hover:border-ds-border-strong transition-colors group"
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0", fileTypeIcons[ext] || "bg-ds-bg-surface text-ds-text-muted")}>
        <FileText className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ds-text-primary truncate">{document.filename}</p>
          {docTypeBadge && (
            <span className={cn("text-[10px] font-medium rounded-full px-2 py-0.5 border shrink-0", docTypeBadge.color, docTypeBadge.bg)}>
              {docTypeBadge.label}
            </span>
          )}
        </div>
        {keyDataSummary && (
          <p className="text-xs text-ds-text-secondary mt-0.5 truncate">{keyDataSummary}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-ds-text-muted">{formatFileSize(document.file_size)}</span>
          <span className="text-xs text-ds-text-muted">{formatRelative(document.created_at)}</span>
          <span className={cn("flex items-center gap-1 text-xs", status.color)}>
            <StatusIcon className={cn("h-3 w-3", status.animate && "animate-spin")} />
            {status.label}
          </span>
        </div>
        {flags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {flags.map((flag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5"
              >
                <AlertTriangle className="h-2.5 w-2.5" />
                {flag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
        {(document.status === "processing" || document.status === "error") && onRetry && (
          <button
            onClick={() => onRetry(document.id)}
            className="rounded-lg p-2 text-ds-text-muted hover:text-ds-text-accent hover:bg-ds-accent-primary/10 transition-all"
            title="Retry processing"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onDelete(document.id)}
          disabled={isDeleting}
          className="rounded-lg p-2 text-ds-text-muted hover:text-ds-feedback-error hover:bg-ds-feedback-error/10 transition-all"
          title="Delete document"
        >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
      </div>
    </motion.div>
  );
}
