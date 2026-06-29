import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/utils/cn";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (type: ToastType, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: "border-ds-feedback-success/30 bg-ds-feedback-success/10",
  error: "border-ds-feedback-error/30 bg-ds-feedback-error/10",
  warning: "border-ds-feedback-warning/30 bg-ds-feedback-warning/10",
  info: "border-ds-accent-primary/30 bg-ds-accent-primary/10",
};

const iconColors = {
  success: "text-ds-feedback-success",
  error: "text-ds-feedback-error",
  warning: "text-ds-feedback-warning",
  info: "text-ds-accent-primary",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const Icon = icons[toast.type];

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => onRemove(toast.id), toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-md min-w-[300px] max-w-[420px]",
        colors[toast.type]
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", iconColors[toast.type])} />
      <p className="flex-1 text-sm text-ds-text-primary">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-ds-text-muted hover:text-ds-text-primary transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
