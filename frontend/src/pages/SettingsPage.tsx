import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, Download, Trash2, AlertTriangle, User, Shield } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { exportMyData, deleteMyAccount } from "@/api/auth";

export function SettingsPage() {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  const [exporting, setExporting] = useState(false); const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); const [deleteConfirm, setDeleteConfirm] = useState("");

  const handleExport = async () => { setExporting(true); try { const blob = await exportMyData(); const url = window.URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "my_data_export.json"; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a); } catch { /* ignored */ } finally { setExporting(false); } };
  const handleDelete = async () => { if (deleteConfirm !== "DELETE") return; setDeleting(true); try { await deleteMyAccount(); await logout(); navigate("/"); } catch { /* ignored */ setDeleting(false); } };

  return (
    <div className="p-6 h-full overflow-auto"><div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ds-accent-primary/20 to-ds-accent-secondary/20 border border-ds-accent-primary/20"><Settings className="h-5 w-5 text-ds-text-accent" /></div><div><h1 className="text-2xl font-bold text-ds-text-primary">Account Settings</h1><p className="text-sm text-ds-text-secondary">Manage your account, data, and privacy</p></div></div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="mb-6"><div className="flex items-center gap-2 mb-4"><User className="h-4 w-4 text-ds-text-accent" /><h2 className="text-sm font-semibold text-ds-text-primary">Profile</h2></div><div className="space-y-3"><div className="flex items-center justify-between"><span className="text-sm text-ds-text-secondary">Email</span><span className="text-sm font-medium text-ds-text-primary">{user?.email}</span></div><div className="flex items-center justify-between"><span className="text-sm text-ds-text-secondary">Name</span><span className="text-sm font-medium text-ds-text-primary">{user?.full_name || "Not set"}</span></div><div className="flex items-center justify-between"><span className="text-sm text-ds-text-secondary">Account created</span><span className="text-sm font-medium text-ds-text-primary">{user?.created_at ? new Date(user.created_at).toLocaleDateString("en-GB") : "N/A"}</span></div></div></Card>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="mb-6"><div className="flex items-center gap-2 mb-4"><Shield className="h-4 w-4 text-ds-text-accent" /><h2 className="text-sm font-semibold text-ds-text-primary">Data & Privacy</h2></div><p className="text-xs text-ds-text-secondary mb-4 leading-relaxed">Under GDPR, you can access and export all your personal data, and request deletion of your account.</p><div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-ds-bg-surface border border-ds-border-default"><div><h3 className="text-sm font-medium text-ds-text-primary">Export My Data</h3><p className="text-xs text-ds-text-muted mt-0.5">Download all your data as JSON</p></div><Button variant="secondary" size="sm" isLoading={exporting} leftIcon={<Download className="h-4 w-4" />} onClick={handleExport}>Export</Button></div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-ds-feedback-error/5 border border-ds-feedback-error/20"><div><h3 className="text-sm font-medium text-ds-text-primary">Delete Account</h3><p className="text-xs text-ds-text-muted mt-0.5">Permanently delete your account and all data</p></div><Button variant="danger" size="sm" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setShowDeleteModal(true)}>Delete</Button></div>
        </div></Card>
      </motion.div>
      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteConfirm(""); }} title="Delete Account" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-ds-feedback-error/10 border border-ds-feedback-error/20"><AlertTriangle className="h-5 w-5 text-ds-feedback-error shrink-0" /><p className="text-sm text-ds-text-primary">This action is permanent and cannot be undone.</p></div>
          <div><label className="block text-sm text-ds-text-secondary mb-1.5">Type <span className="font-mono font-bold text-ds-text-primary">DELETE</span> to confirm</label><input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="w-full rounded-lg border border-ds-border-default bg-ds-bg-surface px-3 py-2 text-sm text-ds-text-primary placeholder-ds-text-muted focus:outline-none focus:border-ds-feedback-error" placeholder="DELETE" /></div>
          <div className="flex justify-end gap-3 pt-2"><Button variant="secondary" size="sm" onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}>Cancel</Button><Button variant="danger" size="sm" isLoading={deleting} disabled={deleteConfirm !== "DELETE"} onClick={handleDelete}>Delete My Account</Button></div>
        </div>
      </Modal>
    </div></div>
  );
}
