import client from "./client";
import type { AdminStats, AdminUser, AdminPayment } from "@/types";

export async function getAdminStats(): Promise<AdminStats> {
  const response = await client.get<AdminStats>("/admin/stats");
  return response.data;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await client.get<AdminUser[]>("/admin/users");
  return response.data;
}

export async function getAdminPayments(): Promise<AdminPayment[]> {
  const response = await client.get<AdminPayment[]>("/admin/payments");
  return response.data;
}

export async function getPrompts(): Promise<{ system_prompt: string; analysis_prompt: string }> {
  const response = await client.get("/admin/prompts");
  return response.data;
}

export async function updatePrompts(prompts: { system_prompt?: string; analysis_prompt?: string }): Promise<void> {
  await client.put("/admin/prompts", prompts);
}
