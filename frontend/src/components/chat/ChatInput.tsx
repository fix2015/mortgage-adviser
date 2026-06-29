import { useState, useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";
import { cn } from "@/utils/cn";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onStop, isStreaming, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) return;
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-ds-border-default bg-ds-bg-secondary/80 backdrop-blur-md p-4">
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Ask about your mortgage options..."}
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl border border-ds-border-default bg-ds-bg-tertiary px-4 py-3 pr-12 text-sm text-ds-text-primary placeholder:text-ds-text-muted",
              "focus:border-ds-border-accent focus:outline-none focus:ring-1 focus:ring-ds-accent-primary/50",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "scrollbar-thin"
            )}
          />
        </div>
        {isStreaming ? (
          <button
            onClick={onStop}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-ds-feedback-error text-white hover:bg-ds-feedback-error/90 transition-colors"
            title="Stop generating"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className={cn(
              "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-200",
              value.trim() && !disabled
                ? "bg-gradient-to-r from-ds-accent-primary to-ds-accent-secondary text-white shadow-lg shadow-ds-accent-primary/20 hover:shadow-ds-accent-primary/40"
                : "bg-ds-bg-surface text-ds-text-muted cursor-not-allowed"
            )}
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="text-center text-[10px] text-ds-text-muted mt-2 max-w-4xl mx-auto">
        AI-generated advice. Always verify with a qualified mortgage adviser.
      </p>
    </div>
  );
}
