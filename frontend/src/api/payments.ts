import client from "./client";
import type { ConsultationInfo } from "@/types";

export async function createCheckout(
  paymentType: "consultation" | "extra_questions",
  consultationId?: number
): Promise<string> {
  const response = await client.post<{ checkout_url: string; session_id: string }>(
    "/payments/checkout",
    {
      payment_type: paymentType,
      consultation_id: consultationId,
      success_url: `${window.location.origin}/dashboard?payment=success`,
      cancel_url: `${window.location.origin}/dashboard?payment=cancelled`,
    }
  );
  return response.data.checkout_url;
}

export async function verifyPayment(sessionId: string): Promise<{ status: string }> {
  const response = await client.post<{ status: string }>("/payments/verify", {
    session_id: sessionId,
  });
  return response.data;
}

export async function createSubscription(): Promise<string> {
  const response = await client.post("/payments/subscribe", {
    success_url: `${window.location.origin}/dashboard?payment=success`,
    cancel_url: `${window.location.origin}/dashboard?payment=cancelled`,
  });
  return response.data.checkout_url;
}

export async function getActiveConsultation(): Promise<ConsultationInfo> {
  const response = await client.get<ConsultationInfo>("/payments/consultation/active");
  return response.data;
}

export async function createReviewCheckout(): Promise<string> {
  const response = await client.post("/payments/checkout-review", {
    success_url: `${window.location.origin}/dashboard/strategy?review=booked`,
    cancel_url: `${window.location.origin}/dashboard/strategy`,
  });
  return response.data.checkout_url;
}
