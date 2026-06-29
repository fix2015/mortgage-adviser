import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Home, Mail, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({ email: z.string().email("Please enter a valid email"), password: z.string().min(6, "Password must be at least 6 characters") });
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(""); setIsLoading(true);
    try { await login(data.email, data.password); navigate("/dashboard"); } catch (err: unknown) {
      let message = "Invalid credentials. Please try again."; if (err && typeof err === "object" && "response" in err) { const ae = err as { response?: { data?: { detail?: string } } }; message = ae.response?.data?.detail || message; } else if (err instanceof Error) message = err.message;
      setError(message);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ds-bg-primary px-4">
      <div className="absolute inset-0 overflow-hidden"><div className="absolute top-1/3 left-1/4 h-96 w-96 rounded-full bg-ds-accent-primary/5 blur-[120px]" /><div className="absolute bottom-1/3 right-1/4 h-96 w-96 rounded-full bg-ds-accent-secondary/5 blur-[120px]" /></div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative w-full max-w-md">
        <div className="glass-strong rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary shadow-lg mb-4"><Home className="h-6 w-6 text-white" /></div><h1 className="text-2xl font-bold text-ds-text-primary">Welcome Back</h1><p className="mt-1 text-sm text-ds-text-secondary">Sign in to your mortgage consultation</p></div>
          {error && <div className="mb-6 rounded-xl border border-ds-feedback-error/30 bg-ds-feedback-error/10 px-4 py-3 text-sm text-ds-feedback-error">{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label="Email" type="email" placeholder="you@email.co.uk" leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register("email")} />
            <Input label="Password" type="password" placeholder="Enter your password" leftIcon={<Lock className="h-4 w-4" />} error={errors.password?.message} {...register("password")} />
            <div className="flex justify-end"><Link to="/forgot-password" className="text-xs text-ds-text-accent hover:underline">Forgot password?</Link></div>
            <Button type="submit" variant="glow" size="lg" className="w-full" isLoading={isLoading}>Sign In</Button>
          </form>
          <p className="mt-6 text-center text-sm text-ds-text-secondary">Don't have an account?{" "}<Link to="/register" className="text-ds-text-accent hover:underline font-medium">Get Started</Link></p>
        </div>
      </motion.div>
    </div>
  );
}
