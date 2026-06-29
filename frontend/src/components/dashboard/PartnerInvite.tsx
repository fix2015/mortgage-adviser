import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Mail, User, Link2, Copy, CheckCircle2, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import client from "@/api/client";

interface PartnerStatus {
  has_partner: boolean;
  partner_email: string | null;
  partner_name: string | null;
  partner_registered: boolean;
  invited_email: string | null;
  invited_name: string | null;
}

interface InviteResponse {
  invite_url: string;
  invite_token: string;
}

export function PartnerInvite() {
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<PartnerStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await client.get<PartnerStatus>("/users/partner-status");
      setStatus(response.data);
    } catch {
      /* ignored */
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleInvite = async () => {
    if (!email.trim() || !name.trim()) {
      setError("Please fill in both fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await client.post<InviteResponse>("/users/invite-partner", {
        email: email.trim(),
        name: name.trim(),
      });
      setInviteUrl(response.data.invite_url);
      fetchStatus();
    } catch (err: unknown) {
      let message = "Failed to generate invite link";
      if (err && typeof err === "object" && "response" in err) {
        const ae = err as { response?: { data?: { detail?: string } } };
        message = ae.response?.data?.detail || message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignored */
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEmail("");
    setName("");
    setInviteUrl(null);
    setError("");
    setCopied(false);
  };

  if (statusLoading) return null;

  // Partner already linked and registered
  if (status?.has_partner && status.partner_registered) {
    return (
      <Card className="relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ds-feedback-success/10 border border-ds-feedback-success/20">
            <CheckCircle2 className="h-5 w-5 text-ds-feedback-success" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ds-text-primary">Partner Joined</h3>
            <p className="text-xs text-ds-text-secondary">
              {status.partner_name || status.partner_email} is linked to your application
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Invite sent but partner hasn't registered yet
  if (status?.invited_email && !status?.has_partner) {
    return (
      <Card className="relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ds-accent-secondary/10 border border-ds-accent-secondary/20">
              <Clock className="h-5 w-5 text-ds-accent-secondary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ds-text-primary">Partner Invited</h3>
              <p className="text-xs text-ds-text-secondary">
                Waiting for {status.invited_name || status.invited_email} to register
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setModalOpen(true)} className="text-xs">
            Resend
          </Button>
        </div>

        <Modal isOpen={modalOpen} onClose={handleCloseModal} title="Invite Your Partner" size="sm">
          <InviteForm
            email={email}
            setEmail={setEmail}
            name={name}
            setName={setName}
            loading={loading}
            error={error}
            inviteUrl={inviteUrl}
            copied={copied}
            onInvite={handleInvite}
            onCopy={handleCopy}
          />
        </Modal>
      </Card>
    );
  }

  // No invite sent yet
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ds-accent-primary/10 border border-ds-accent-primary/20">
            <Users className="h-5 w-5 text-ds-text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ds-text-primary">Joint Application</h3>
            <p className="text-xs text-ds-text-secondary">
              Invite your partner to link their documents
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
          leftIcon={<Users className="h-3.5 w-3.5" />}
          className="text-xs"
        >
          Invite Partner
        </Button>
      </div>

      <Modal isOpen={modalOpen} onClose={handleCloseModal} title="Invite Your Partner" size="sm">
        <InviteForm
          email={email}
          setEmail={setEmail}
          name={name}
          setName={setName}
          loading={loading}
          error={error}
          inviteUrl={inviteUrl}
          copied={copied}
          onInvite={handleInvite}
          onCopy={handleCopy}
        />
      </Modal>
    </Card>
  );
}

function InviteForm({
  email,
  setEmail,
  name,
  setName,
  loading,
  error,
  inviteUrl,
  copied,
  onInvite,
  onCopy,
}: {
  email: string;
  setEmail: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  loading: boolean;
  error: string;
  inviteUrl: string | null;
  copied: boolean;
  onInvite: () => void;
  onCopy: () => void;
}) {
  if (inviteUrl) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center py-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ds-feedback-success/10 border border-ds-feedback-success/20 mb-3">
            <Link2 className="h-7 w-7 text-ds-feedback-success" />
          </div>
          <h3 className="text-sm font-semibold text-ds-text-primary mb-1">Invite Link Generated</h3>
          <p className="text-xs text-ds-text-secondary text-center">
            Share this link with your partner to join your application
          </p>
        </div>

        <div className="rounded-lg border border-ds-border-default bg-ds-bg-surface p-3">
          <p className="text-xs text-ds-text-primary break-all font-mono">{inviteUrl}</p>
        </div>

        <Button variant="glow" className="w-full" onClick={onCopy} leftIcon={copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
          {copied ? "Copied!" : "Copy Link"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ds-text-secondary">
        Your partner will receive an invite link to create their account and link to your mortgage application.
      </p>

      {error && (
        <div className="rounded-lg border border-ds-feedback-error/30 bg-ds-feedback-error/10 px-3 py-2 text-xs text-ds-feedback-error">
          {error}
        </div>
      )}

      <Input
        label="Partner's Name"
        placeholder="Jane Smith"
        value={name}
        onChange={(e) => setName(e.target.value)}
        leftIcon={<User className="h-4 w-4" />}
      />

      <Input
        label="Partner's Email"
        type="email"
        placeholder="partner@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={<Mail className="h-4 w-4" />}
      />

      <Button
        variant="glow"
        className="w-full"
        onClick={onInvite}
        isLoading={loading}
        leftIcon={<Link2 className="h-4 w-4" />}
      >
        Generate Invite Link
      </Button>
    </div>
  );
}
