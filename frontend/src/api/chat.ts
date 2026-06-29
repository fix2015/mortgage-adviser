import client from "./client";
import type { ChatMessage, ChatSession, ReadinessScoreResponse, NewsResponse, StrategyResponse } from "@/types";

export async function getChatSession(): Promise<ChatSession> {
  const response = await client.get<ChatSession>("/chat/session");
  return response.data;
}

export async function getChatSuggestions(): Promise<string[]> {
  const response = await client.get<{ suggestions: string[] }>("/chat/suggestions");
  return response.data.suggestions;
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  const response = await client.get<{ messages: ChatMessage[]; total: number }>("/chat/history/");
  return response.data.messages;
}

export async function sendMessage(content: string, agent?: string): Promise<ChatMessage> {
  const response = await client.post<ChatMessage>("/chat/send", { message: content, agent: agent || "mortgage" });
  return response.data;
}

export async function getReadinessScore(): Promise<ReadinessScoreResponse> {
  const response = await client.get("/chat/health-score");
  return response.data;
}

export async function finishConsultation(): Promise<{ message: string }> {
  const response = await client.post("/chat/finish");
  return response.data;
}

export async function getNews(): Promise<NewsResponse> {
  const response = await client.get("/chat/news");
  return response.data;
}

export async function getStrategies(): Promise<{ strategies: StrategyResponse[]; total: number }> {
  const response = await client.get("/chat/strategies");
  return response.data;
}

export async function generateStrategy(title: string): Promise<StrategyResponse> {
  const response = await client.post("/chat/report", { title });
  return response.data;
}

export async function downloadStrategy(strategyId: number): Promise<Blob> {
  const response = await client.get(`/chat/strategies/${strategyId}/download`, {
    responseType: "blob",
  });
  return response.data;
}

export function streamMessage(
  content: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  agent?: string
): () => void {
  const token = localStorage.getItem("access_token");
  const controller = new AbortController();

  fetch("/api/v1/chat/send/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message: content, agent: agent || "mortgage" }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        onError(errorData.detail || "Failed to send message");
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError("No response body");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onDone();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              onDone();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch {
              onChunk(data);
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        onError(err.message || "Stream error");
      }
    });

  return () => controller.abort();
}
