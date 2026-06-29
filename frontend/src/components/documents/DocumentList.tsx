import { AnimatePresence } from "framer-motion";
import { FileText } from "lucide-react";
import { DocumentCard } from "./DocumentCard";
import { Spinner } from "@/components/ui/Spinner";
import type { Document } from "@/types";

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function DocumentList({ documents, isLoading, onDelete, isDeleting }: DocumentListProps) {
  if (isLoading) {
    return <Spinner className="py-12" />;
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ds-bg-surface border border-ds-border-default mb-4">
          <FileText className="h-7 w-7 text-ds-text-muted" />
        </div>
        <h3 className="text-lg font-medium text-ds-text-primary mb-1">No documents yet</h3>
        <p className="text-sm text-ds-text-secondary max-w-sm">
          Upload your financial documents to get started with your AI tax consultation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
