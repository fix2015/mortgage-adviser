import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Home, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { resetPassword } from "@/api/auth";

const schema = z.object({ newPassword: z.string().min(8, "Password must be at least 8 characters"), confirmPassword: z.string() }).refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
type FormData = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams(); const navigate = useNavigate(); const token = searchParams.get("token") || "";
  const [error, setError] = useState(""); const [success, setSuccess] = useState(false); const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const onSubmit = async (data: FormData) => { if (!token) { setError("Invalid reset link."); return; } setError(""); setIsLoading(true); try { await resetPassword(token, data.newPassword); setSuccess(true); setTimeout(() => navigate("/login"), 3000); } catch (err: unknown) { let m = "Something went wrong."; if (err && typeof err === "object" && "response" in err) { const ae = err as { response?: { data?: { detail?: string } } }; m = ae.response?.data?.detail || m; } setError(m); } finally { setIsLoading(false); } };
  return (
    <div className="flex min-h-screen items-center justify-center bg-ds-bg-primary px-4">
      <div className="absolute inset-0 overflow-hidden"><div className="absolute top-1/3 left-1/4 h-96 w-96 rounded-full bg-ds-accent-primary/5 blur-[120px]" /><div className="absolute bottom-1/3 right-1/4 h-96 w-96 rounded-full bg-ds-accent-secondary/5 blur-[120px]" /></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="glass-strong rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary shadow-lg mb-4"><Home className="h-6 w-6 text-white" /></div><h1 className="text-2xl font-bold text-ds-text-primary">Reset Password</h1><p className="mt-1 text-sm text-ds-text-secondary">Enter your new password</p></div>
          {!token && <div className="text-center"><div className="mb-6 rounded-xl border border-ds-feedback-error/30 bg-ds-feedback-error/10 px-4 py-3 text-sm text-ds-feedback-error">Invalid reset link.</div><Link to="/forgot-password" className="text-ds-text-accent hover:underline font-medium text-sm">Request New Link</Link></div>}
          {token && error && <div className="mb-6 rounded-xl border border-ds-feedback-error/30 bg-ds-feedback-error/10 px-4 py-3 text-sm text-ds-feedback-error">{error}</div>}
          {success ? (<div className="text-center"><div className="mb-6 rounded-xl border border-ds-feedback-success/30 bg-ds-feedback-success/10 px-4 py-3 text-sm text-ds-feedback-success">Password reset. Redirecting...</div><Link to="/login" className="text-ds-text-accent hover:underline font-medium text-sm">Go to Sign In</Link></div>) : (token && (<><form onSubmit={handleSubmit(onSubmit)} className="space-y-5"><Input label="New Password" type="password" placeholder="Enter new password" leftIcon={<Lock className="h-4 w-4" />} error={errors.newPassword?.message} {...register("newPassword")} /><Input label="Confirm Password" type="password" placeholder="Confirm new password" leftIcon={<Lock className="h-4 w-4" />} error={errors.confirmPassword?.message} {...register("confirmPassword")} /><Button type="submit" variant="glow" size="lg" className="w-full" isLoading={isLoading}>Reset Password</Button></form><p className="mt-6 text-center text-sm text-ds-text-secondary">Remember your password?{" "}<Link to="/login" className="text-ds-text-accent hover:underline font-medium">Sign In</Link></p></>))}
        </div>
      </motion.div>
    </div>
  );
}
