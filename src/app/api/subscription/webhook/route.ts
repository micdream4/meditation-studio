import { headers } from "next/headers";

import { apiError, apiSuccess } from "@/lib/api";
import { getRequiredEnv } from "@/lib/env";
import { getStripeClient, syncStripeSubscription } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return apiError("missing_signature", "Missing Stripe signature.", 400);
  }

  const payload = await request.text();
  const stripe = getStripeClient();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      getRequiredEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch (error) {
    return apiError(
      "invalid_signature",
      error instanceof Error ? error.message : "Invalid Stripe signature.",
      400,
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id,
        );
        await syncStripeSubscription(subscription);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncStripeSubscription(event.data.object);
      break;
    }
    default:
      break;
  }

  return apiSuccess({ received: true });
}
