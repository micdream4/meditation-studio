import { headers } from "next/headers";

import { apiError, apiSuccess } from "@/lib/api";
import {
  type CreemWebhookEvent,
  syncCreemWebhookEvent,
  verifyCreemWebhookSignature,
} from "@/lib/creem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = (await headers()).get("creem-signature");

  if (!signature) {
    return apiError("missing_signature", "Missing Creem signature.", 400);
  }

  const payload = await request.text();

  if (!verifyCreemWebhookSignature(payload, signature)) {
    return apiError(
      "invalid_signature",
      "Invalid Creem signature.",
      400,
    );
  }

  const event = JSON.parse(payload) as CreemWebhookEvent;
  const syncEvents = new Set([
    "checkout.completed",
    "subscription.active",
    "subscription.paid",
    "subscription.canceled",
    "subscription.scheduled_cancel",
    "subscription.past_due",
    "subscription.expired",
    "subscription.update",
    "subscription.trialing",
    "subscription.paused",
  ]);

  if (event.eventType && syncEvents.has(event.eventType)) {
    await syncCreemWebhookEvent(event);
  }

  return apiSuccess({ received: true });
}
