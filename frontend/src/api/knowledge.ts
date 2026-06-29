import client from "./client";
import type { KnowledgeGraph } from "@/types";

export async function getKnowledgeGraph(): Promise<KnowledgeGraph> {
  const response = await client.get<KnowledgeGraph>("/knowledge/graph");
  return response.data;
}

export async function getNodeDetails(nodeId: string): Promise<{ id: string; label: string; details: string; connections: string[] }> {
  const response = await client.get(`/knowledge/nodes/${nodeId}`);
  return response.data;
}
