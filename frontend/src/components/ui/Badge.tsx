import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-ds-bg-surface text-ds-text-secondary border border-ds-border-default",
        accent: "bg-ds-accent-primary/15 text-ds-text-accent border border-ds-accent-primary/30",
        success: "bg-ds-feedback-success/15 text-ds-feedback-success border border-ds-feedback-success/30",
        error: "bg-ds-feedback-error/15 text-ds-feedback-error border border-ds-feedback-error/30",
        warning: "bg-ds-feedback-warning/15 text-ds-feedback-warning border border-ds-feedback-warning/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
