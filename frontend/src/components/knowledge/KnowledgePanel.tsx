import { motion, AnimatePresence } from "framer-motion";
import { X, Link as LinkIcon } from "lucide-react";
import type { KnowledgeNode } from "@/types";
import { Badge } from "@/components/ui/Badge";

const categoryColors: Record<string, "accent" | "success" | "error" | "warning" | "default"> = {
  income: "success",
  property: "accent",
  mortgage: "warning",
  deposit: "default",
  lender: "accent",
  strategy: "accent",
  regulation: "default",
};

interface KnowledgePanelProps {
  node: KnowledgeNode | null;
  onClose: () => void;
}

export function KnowledgePanel({ node, onClose }: KnowledgePanelProps) {
  return (
    <AnimatePresence>
      {node && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className="absolute top-3 right-3 w-72 glass-strong rounded-xl shadow-2xl z-10"
        >
          <div className="flex items-center justify-between p-4 border-b border-ds-border-default/50">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-ds-text-accent" />
              <h3 className="text-sm font-semibold text-ds-text-primary">Node Details</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-ds-text-muted hover:text-ds-text-primary hover:bg-ds-bg-surface transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <p className="text-xs text-ds-text-muted mb-1">Label</p>
              <p className="text-sm font-medium text-ds-text-primary">{node.label}</p>
            </div>
            <div>
              <p className="text-xs text-ds-text-muted mb-1">Category</p>
              <Badge variant={categoryColors[node.category] || "default"}>
                {node.category}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-ds-text-muted mb-1">Value</p>
              <p className="text-sm text-ds-text-primary">{node.value}</p>
            </div>
            {node.details && (
              <div>
                <p className="text-xs text-ds-text-muted mb-1">Details</p>
                <p className="text-xs text-ds-text-secondary leading-relaxed">{node.details}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
