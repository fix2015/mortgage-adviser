import client from "./client";
import type { AuthTokens, LoginRequest, RegisterRequest, User } from "@/types";

export async function login(data: LoginRequest): Promise<AuthTokens> {
  const response = await client.post<AuthTokens>("/auth/login", data);
  return response.data;
}

export async function register(data: RegisterRequest): Promise<AuthTokens> {
  const response = await client.post<AuthTokens>("/auth/register", data);
  return response.data;
}

export async function getMe(): Promise<User> {
  const response = await client.get<User>("/users/me");
  return response.data;
}

export async function logout(): Promise<void> {
  await client.post("/auth/logout");
}

export async function refreshToken(refresh_token: string): Promise<AuthTokens> {
  const response = await client.post<AuthTokens>("/auth/refresh", { refresh_token });
  return response.data;
}

export interface BuyerInfoData {
  buyer_type?: string;
  income_range?: string;
  property_value?: number;
}

export async function updateBuyerInfo(data: BuyerInfoData): Promise<User> {
  const response = await client.patch<User>("/users/me/business", data);
  return response.data;
}

export async function forgotPassword(email: string): Promise<{ message: string; token?: string }> {
  const response = await client.post<{ message: string; token?: string }>("/auth/forgot-password", { email });
  return response.data;
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const response = await client.post<{ message: string }>("/auth/reset-password", { token, new_password: newPassword });
  return response.data;
}

export async function exportMyData(): Promise<Blob> {
  const response = await client.get("/users/me/export", { responseType: "blob" });
  return response.data;
}

export async function deleteMyAccount(): Promise<void> {
  await client.delete("/users/me");
}
