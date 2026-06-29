import { cn } from "@/utils/cn";
import { MessageSquare } from "lucide-react";

interface QuestionCounterProps {
  used: number;
  total: number;
  className?: string;
}

export function QuestionCounter({ used, total, className }: QuestionCounterProps) {
  const percentage = (used / total) * 100;
  const isLow = total - used <= 5;
  const isOut = used >= total;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <MessageSquare className={cn("h-4 w-4", isOut ? "text-ds-feedback-error" : isLow ? "text-ds-feedback-warning" : "text-ds-text-accent")} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-ds-text-secondary">
            Questions: {used}/{total}
          </span>
          {isOut && (
            <span className="text-xs text-ds-feedback-error font-medium">Limit reached</span>
          )}
        </div>
        <div className="h-1.5 w-full rounded-full bg-ds-bg-surface overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isOut ? "bg-ds-feedback-error" : isLow ? "bg-ds-feedback-warning" : "bg-gradient-to-r from-ds-accent-primary to-ds-accent-secondary"
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
