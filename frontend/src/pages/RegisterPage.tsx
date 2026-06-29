import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Home, Mail, Lock, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({ name: z.string().min(2, "Name must be at least 2 characters"), email: z.string().email("Please enter a valid email"), password: z.string().min(8, "Password must be at least 8 characters"), confirmPassword: z.string() }).refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(""); setIsLoading(true);
    try { await authRegister(data.email, data.password, data.name); navigate("/dashboard"); } catch (err: unknown) {
      let message = "Registration failed."; if (err && typeof err === "object" && "response" in err) { const ae = err as { response?: { data?: { detail?: string } } }; message = ae.response?.data?.detail || message; } else if (err instanceof Error) message = err.message;
      setError(message);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ds-bg-primary px-4">
      <div className="absolute inset-0 overflow-hidden"><div className="absolute top-1/3 left-1/4 h-96 w-96 rounded-full bg-ds-accent-primary/5 blur-[120px]" /><div className="absolute bottom-1/3 right-1/4 h-96 w-96 rounded-full bg-ds-accent-secondary/5 blur-[120px]" /></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative w-full max-w-md">
        <div className="glass-strong rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary shadow-lg mb-4"><Home className="h-6 w-6 text-white" /></div><h1 className="text-2xl font-bold text-ds-text-primary">Create Account</h1><p className="mt-1 text-sm text-ds-text-secondary">Start your AI mortgage consultation</p></div>
          {error && <div className="mb-6 rounded-xl border border-ds-feedback-error/30 bg-ds-feedback-error/10 px-4 py-3 text-sm text-ds-feedback-error">{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label="Full Name" type="text" placeholder="John Smith" leftIcon={<User className="h-4 w-4" />} error={errors.name?.message} {...register("name")} />
            <Input label="Email" type="email" placeholder="you@email.co.uk" leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register("email")} />
            <Input label="Password" type="password" placeholder="At least 8 characters" leftIcon={<Lock className="h-4 w-4" />} error={errors.password?.message} {...register("password")} />
            <Input label="Confirm Password" type="password" placeholder="Repeat your password" leftIcon={<Lock className="h-4 w-4" />} error={errors.confirmPassword?.message} {...register("confirmPassword")} />
            <Button type="submit" variant="glow" size="lg" className="w-full" isLoading={isLoading}>Create Account</Button>
          </form>
          <p className="mt-4 text-center text-xs text-ds-text-muted leading-relaxed">By creating an account, you agree to our <Link to="/terms" className="text-ds-text-accent hover:underline">Terms</Link> and <Link to="/privacy" className="text-ds-text-accent hover:underline">Privacy Policy</Link>.</p>
          <p className="mt-4 text-center text-sm text-ds-text-secondary">Already have an account?{" "}<Link to="/login" className="text-ds-text-accent hover:underline font-medium">Sign In</Link></p>
        </div>
      </motion.div>
    </div>
  );
}
