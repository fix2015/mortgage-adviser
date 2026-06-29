import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";
import { cn } from "@/utils/cn";
import type { ChatMessage as ChatMessageType } from "@/types";
import { formatRelative } from "@/utils/format";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
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

      {/* Message content */}
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
          <div className="prose-chat text-sm text-ds-text-primary leading-relaxed">
            <ReactMarkdown>{message.content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-0.5 bg-ds-text-accent animate-pulse rounded-sm" />
            )}
          </div>
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
