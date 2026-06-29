import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Receipt,
  FileText,
  Landmark,
  FileCheck,
  FileSignature,
  File,
  FolderOpen,
  Layers,
  Download,
  Loader2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { getOrganizedDocuments, downloadFolder } from "@/api/documents";
import { DocumentCard } from "./DocumentCard";
import { Spinner } from "@/components/ui/Spinner";

const iconMap: Record<string, typeof FileText> = {
  receipt: Receipt,
  "file-text": FileText,
  landmark: Landmark,
  "file-check": FileCheck,
  "file-signature": FileSignature,
  file: File,
};

const folderColorMap: Record<string, string> = {
  payslip: "text-pink-400 bg-pink-500/15 border-pink-500/20",
  invoice: "text-blue-400 bg-blue-500/15 border-blue-500/20",
  bank_statement: "text-green-400 bg-green-500/15 border-green-500/20",
  tax_return: "text-purple-400 bg-purple-500/15 border-purple-500/20",
  receipt: "text-amber-400 bg-amber-500/15 border-amber-500/20",
  contract: "text-cyan-400 bg-cyan-500/15 border-cyan-500/20",
  other: "text-gray-400 bg-gray-500/15 border-gray-500/20",
};

interface DocumentOrganizerProps {
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

export function DocumentOrganizer({ onDelete, isDeleting }: DocumentOrganizerProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = useCallback(async (folderType?: string) => {
    const key = folderType || "__all__";
    setDownloading(key);
    try {
      const blob = await downloadFolder(folderType);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${folderType || "All_Documents"}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Download failed silently
    } finally {
      setDownloading(null);
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["documents", "organized"],
    queryFn: getOrganizedDocuments,
  });

  if (isLoading) {
    return <Spinner className="py-12" />;
  }

  if (!data || data.total_documents === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ds-bg-surface border border-ds-border-default mb-4">
          <FolderOpen className="h-7 w-7 text-ds-text-muted" />
        </div>
        <h3 className="text-lg font-medium text-ds-text-primary mb-1">No documents yet</h3>
        <p className="text-sm text-ds-text-secondary max-w-sm">
          Upload your financial documents to see them organized into folders automatically.
        </p>
      </div>
    );
  }

  const folders = data.folders;
  const activeFolderData = selectedFolder
    ? folders.find((f) => f.type === selectedFolder)
    : null;

  const displayDocuments = activeFolderData
    ? activeFolderData.documents
    : folders.flatMap((f) => f.documents);

  const displayTitle = activeFolderData ? activeFolderData.name : "All Documents";
  const displayCount = activeFolderData ? activeFolderData.count : data.total_documents;

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-ds-text-secondary">
          <Layers className="h-4 w-4" />
          <span>
            {data.total_documents} document{data.total_documents !== 1 ? "s" : ""} in{" "}
            {data.total_folders} folder{data.total_folders !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={() => handleDownload()}
          disabled={downloading === "__all__"}
          className="flex items-center gap-1.5 rounded-lg border border-ds-border-default bg-ds-bg-surface px-3 py-1.5 text-xs font-medium text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-bg-secondary transition-colors disabled:opacity-50"
        >
          {downloading === "__all__" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Download All
        </button>
      </div>

      <div className="flex gap-4 min-h-[400px]">
        {/* Sidebar */}
        <div className="w-[30%] min-w-[200px] shrink-0 rounded-xl border border-ds-border-default bg-ds-bg-secondary/50 backdrop-blur-sm overflow-hidden">
          <div className="p-3 border-b border-ds-border-default">
            <h3 className="text-xs font-semibold text-ds-text-muted uppercase tracking-wider">
              Folders
            </h3>
          </div>

          <div className="p-2 space-y-1">
            {/* All Documents */}
            <button
              onClick={() => setSelectedFolder(null)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
                selectedFolder === null
                  ? "bg-ds-accent-primary/10 border border-ds-accent-primary/20 text-ds-text-accent"
                  : "hover:bg-ds-bg-surface text-ds-text-secondary hover:text-ds-text-primary border border-transparent"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                  selectedFolder === null
                    ? "bg-ds-accent-primary/20 text-ds-text-accent"
                    : "bg-ds-bg-surface text-ds-text-muted"
                )}
              >
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium flex-1 truncate">All Documents</span>
              <span
                className={cn(
                  "text-xs font-medium rounded-full px-2 py-0.5",
                  selectedFolder === null
                    ? "bg-ds-accent-primary/20 text-ds-text-accent"
                    : "bg-ds-bg-surface text-ds-text-muted"
                )}
              >
                {data.total_documents}
              </span>
            </button>

            {/* Folder items */}
            {folders.map((folder) => {
              const IconComponent = iconMap[folder.icon] || File;
              const colorClasses = folderColorMap[folder.type] || folderColorMap.other;
              const isSelected = selectedFolder === folder.type;

              return (
                <div key={folder.type} className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedFolder(folder.type)}
                    className={cn(
                      "flex-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
                      isSelected
                        ? "bg-ds-accent-primary/10 border border-ds-accent-primary/20 text-ds-text-accent"
                        : "hover:bg-ds-bg-surface text-ds-text-secondary hover:text-ds-text-primary border border-transparent"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg border shrink-0",
                        isSelected
                          ? "bg-ds-accent-primary/20 border-ds-accent-primary/20 text-ds-text-accent"
                          : colorClasses
                      )}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium flex-1 truncate">{folder.name}</span>
                    <span
                      className={cn(
                        "text-xs font-medium rounded-full px-2 py-0.5",
                        isSelected
                          ? "bg-ds-accent-primary/20 text-ds-text-accent"
                          : "bg-ds-bg-surface text-ds-text-muted"
                      )}
                    >
                      {folder.count}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(folder.type);
                    }}
                    disabled={downloading === folder.type}
                    className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md text-ds-text-muted hover:text-ds-text-primary hover:bg-ds-bg-surface transition-colors disabled:opacity-50"
                    title={`Download ${folder.name} as ZIP`}
                  >
                    {downloading === folder.type ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Document panel */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-ds-text-accent" />
              <h3 className="text-base font-semibold text-ds-text-primary">
                {displayTitle}
              </h3>
              <span className="text-xs text-ds-text-muted">
                ({displayCount} document{displayCount !== 1 ? "s" : ""})
              </span>
            </div>
          </div>

          {displayDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen className="h-10 w-10 text-ds-text-muted mb-3" />
              <p className="text-sm text-ds-text-secondary">No documents in this folder</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedFolder || "all"}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {displayDocuments.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onDelete={onDelete}
                      isDeleting={isDeleting}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
