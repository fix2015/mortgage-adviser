import { useState } from "react";
import { FileUpload } from "@/components/documents/FileUpload";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentOrganizer } from "@/components/documents/DocumentOrganizer";
import { useDocuments } from "@/hooks/useDocuments";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { createCheckout } from "@/api/payments";
import { Sparkles, Zap, FileText, MessageSquare, Download, LayoutList, FolderOpen } from "lucide-react";
import { cn } from "@/utils/cn";

export function DocumentsPage() {
  const { documents, isLoading, upload, isUploading, uploadZip: uploadZipFn, isUploadingZip, remove, isDeleting } = useDocuments();
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [viewMode, setViewMode] = useState<"folder" | "list">("folder");

  const handleUpgrade = async () => { setIsUpgrading(true); try { const url = await createCheckout("consultation"); window.location.href = url; } catch { toast("error", "Failed to start checkout."); setIsUpgrading(false); } };
  const handleUpload = async (file: File) => {
    try { if (file.name.toLowerCase().endsWith(".zip")) { const result = await uploadZipFn(file); toast("success", `Processed ${result.processed} file${result.processed !== 1 ? "s" : ""} from archive`); return; } await upload(file); toast("success", `${file.name} uploaded successfully`); } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) { const ae = err as { response?: { status?: number; data?: { detail?: string } } }; if (ae.response?.status === 403) { setShowUpgradeModal(true); return; } if (ae.response?.data?.detail?.includes("already been uploaded")) { toast("error", `${file.name} already uploaded`); return; } }
      toast("error", `Failed to upload ${file.name}`);
    }
  };
  const handleDelete = async (id: number) => { try { await remove(id); toast("success", "Document deleted"); } catch { toast("error", "Failed to delete"); } };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 h-full overflow-auto">
      <div><h1 className="text-2xl font-bold text-ds-text-primary">Documents</h1><p className="text-sm text-ds-text-secondary mt-1">Upload your mortgage documents for AI analysis</p></div>
      <FileUpload onUpload={handleUpload} isUploading={isUploading || isUploadingZip} />
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ds-text-primary">Uploaded Documents ({documents.length})</h2>
          <div className="flex items-center rounded-lg border border-ds-border-default bg-ds-bg-secondary p-1">
            <button onClick={() => setViewMode("folder")} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150", viewMode === "folder" ? "bg-ds-accent-primary/15 text-ds-text-accent border border-ds-accent-primary/20" : "text-ds-text-muted hover:text-ds-text-secondary border border-transparent")}><FolderOpen className="h-3.5 w-3.5" />Folder View</button>
            <button onClick={() => setViewMode("list")} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150", viewMode === "list" ? "bg-ds-accent-primary/15 text-ds-text-accent border border-ds-accent-primary/20" : "text-ds-text-muted hover:text-ds-text-secondary border border-transparent")}><LayoutList className="h-3.5 w-3.5" />List View</button>
          </div>
        </div>
        {viewMode === "folder" ? <DocumentOrganizer onDelete={handleDelete} isDeleting={isDeleting} /> : <DocumentList documents={documents} isLoading={isLoading} onDelete={handleDelete} isDeleting={isDeleting} />}
      </div>

      <Modal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} size="md">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20 mx-auto mb-6"><Sparkles className="h-8 w-8 text-ds-text-accent" /></div>
          <h2 className="text-xl font-bold text-ds-text-primary mb-2">Upgrade to Full Consultation</h2>
          <p className="text-sm text-ds-text-secondary mb-6">Your free trial includes 1 document. Upgrade for unlimited uploads.</p>
          <div className="rounded-xl border border-ds-border-default bg-ds-bg-secondary p-5 mb-6 text-left">
            <div className="flex items-baseline justify-between mb-4"><span className="text-sm font-medium text-ds-text-primary">Full Consultation</span><div><span className="text-2xl font-bold text-ds-text-primary">£15</span><span className="text-xs text-ds-text-muted ml-1">one-time</span></div></div>
            <ul className="space-y-2.5">{[{ icon: FileText, text: "Unlimited document uploads" }, { icon: MessageSquare, text: "50 AI consultation questions" }, { icon: Download, text: "Strategy PDF report" }, { icon: Zap, text: "50+ lender comparison" }].map(({ icon: Icon, text }) => (<li key={text} className="flex items-center gap-2.5 text-sm text-ds-text-secondary"><Icon className="h-4 w-4 text-ds-feedback-success shrink-0" />{text}</li>))}</ul>
          </div>
          <div className="flex gap-3"><Button variant="ghost" size="lg" className="flex-1" onClick={() => setShowUpgradeModal(false)}>Maybe Later</Button><Button variant="glow" size="lg" className="flex-1" onClick={handleUpgrade} isLoading={isUpgrading}>Upgrade for £15</Button></div>
        </div>
      </Modal>
    </div>
  );
}
