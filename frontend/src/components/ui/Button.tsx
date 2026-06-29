import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-ds font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ds-bg-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-ds-accent-primary to-ds-accent-secondary text-white hover:shadow-lg hover:shadow-ds-accent-primary/25 active:scale-[0.98]",
        secondary:
          "bg-ds-bg-surface text-ds-text-primary border border-ds-border-default hover:border-ds-border-strong hover:bg-ds-bg-tertiary",
        outline:
          "border border-ds-border-accent text-ds-text-accent hover:bg-ds-accent-primary/10",
        ghost:
          "text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-bg-surface/50",
        danger:
          "bg-ds-feedback-error text-white hover:bg-ds-feedback-error/90",
        glow:
          "bg-gradient-to-r from-ds-accent-primary to-ds-accent-secondary text-white shadow-lg shadow-ds-accent-primary/30 hover:shadow-ds-accent-primary/50 hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";
