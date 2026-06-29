import { useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Bot, User, ArrowRight } from "lucide-react";
import { cn } from "@/utils/cn";
import type { ChatMessage as ChatMessageType } from "@/types";
import { formatRelative } from "@/utils/format";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  onQuestionClick?: (question: string) => void;
}

function extractSuggestions(content: string): { mainContent: string; suggestions: string[] } {
  // Look for "You might also want to ask:" section at the end
  const markers = ["you might also want to ask", "you might want to ask", "suggested questions", "follow-up questions"];
  const lowerContent = content.toLowerCase();

  let splitIndex = -1;
  for (const marker of markers) {
    const idx = lowerContent.lastIndexOf(marker);
    if (idx !== -1) {
      // Find the start of the line containing the marker
      const lineStart = content.lastIndexOf("\n", idx);
      splitIndex = lineStart !== -1 ? lineStart : idx;
      break;
    }
  }

  if (splitIndex === -1) return { mainContent: content, suggestions: [] };

  const mainContent = content.substring(0, splitIndex).trim();
  const suggestionsText = content.substring(splitIndex);

  // Extract numbered questions: "1. Question?" or "- Question?"
  const suggestions: string[] = [];
  const lines = suggestionsText.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(?:\d+[\.\)]\s*|-\s*|\*\s*)(.*\?.*)/);
    if (match) {
      suggestions.push(match[1].trim());
    }
  }

  return { mainContent, suggestions };
}

export function ChatMessage({ message, isStreaming, onQuestionClick }: ChatMessageProps) {
  const isUser = message.role === "user";

  const { mainContent, suggestions } = useMemo(() => {
    if (isUser || isStreaming) return { mainContent: message.content, suggestions: [] };
    return extractSuggestions(message.content);
  }, [message.content, isUser, isStreaming]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
          isUser
            ? "bg-ds-bg-surface border border-ds-border-default"
            : "bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-ds-text-secondary" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-ds-accent-primary/15 border border-ds-accent-primary/20"
            : "glass"
        )}
      >
        {isUser ? (
          <p className="text-sm text-ds-text-primary leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        ) : (
          <>
            <div className="prose-chat text-sm text-ds-text-primary leading-relaxed">
              <ReactMarkdown>{mainContent}</ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-0.5 bg-ds-text-accent animate-pulse rounded-sm" />
              )}
            </div>
            {suggestions.length > 0 && onQuestionClick && (
              <div className="mt-3 pt-3 border-t border-ds-border-default/50">
                <p className="text-[10px] font-semibold text-ds-text-muted uppercase tracking-wider mb-2">You might also want to ask:</p>
                <div className="space-y-1.5">
                  {suggestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => onQuestionClick(q)}
                      className="flex items-center gap-2 w-full text-left text-xs text-ds-text-secondary hover:text-ds-text-accent rounded-lg px-2 py-1.5 hover:bg-ds-accent-primary/5 transition-colors group"
                    >
                      <span className="flex-1">{q}</span>
                      <ArrowRight className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-ds-text-accent" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <p className="mt-1.5 text-[10px] text-ds-text-muted">
          {formatRelative(message.created_at)}
        </p>
      </div>
    </motion.div>
  );
}

export function StreamingMessage({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ds-accent-primary to-ds-accent-secondary">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="max-w-[75%] rounded-2xl px-4 py-3 glass">
        <div className="prose-chat text-sm text-ds-text-primary leading-relaxed">
          <ReactMarkdown>{content}</ReactMarkdown>
          <span className="inline-block w-2 h-4 ml-0.5 bg-ds-text-accent animate-pulse rounded-sm" />
        </div>
      </div>
    </motion.div>
  );
}
