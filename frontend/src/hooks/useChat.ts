import { useState, useCallback, useRef } from "react";
import { streamMessage, getChatHistory } from "@/api/chat";
import type { ChatMessage } from "@/types";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const history = await getChatHistory();
      setMessages(history);
    } catch {
      // No history yet
    }
  }, []);

  const sendMessage = useCallback((content: string, agent?: string) => {
    setError(null);

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      created_at: new Date().toISOString(),
      session_id: "",
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingContent("");

    let accumulated = "";

    const abort = streamMessage(
      content,
      (chunk) => {
        accumulated += chunk;
        setStreamingContent(accumulated);
      },
      () => {
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: accumulated,
          created_at: new Date().toISOString(),
          session_id: "",
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent("");
        setIsStreaming(false);
      },
      (err) => {
        setError(err);
        setIsStreaming(false);
        setStreamingContent("");
      },
      agent
    );

    abortRef.current = abort;
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.();
    setIsStreaming(false);
    if (streamingContent) {
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: streamingContent,
        created_at: new Date().toISOString(),
        session_id: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    }
  }, [streamingContent]);

  return {
    messages,
    isStreaming,
    streamingContent,
    error,
    sendMessage,
    stopStreaming,
    loadHistory,
  };
}
