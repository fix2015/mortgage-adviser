import React from "react";
import { cn } from "@/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-ds-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full rounded-ds border border-ds-border-default bg-ds-bg-secondary px-3 py-2.5 text-sm text-ds-text-primary placeholder:text-ds-text-muted transition-colors duration-200",
              "focus:border-ds-border-accent focus:outline-none focus:ring-1 focus:ring-ds-accent-primary/50",
              "disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "pl-10",
              error && "border-ds-feedback-error focus:border-ds-feedback-error focus:ring-ds-feedback-error/50",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-ds-feedback-error">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
