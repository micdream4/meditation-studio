import { NextRequest } from "next/server";

import type { SubscriptionPlan } from "@/types/api";
import { apiError, apiSuccess, isRecord, readJson } from "@/lib/api";
import { ensureUserProfile, getRequestUser } from "@/lib/auth";
import {
  getOrCreateStripeCustomer,
  getStripeClient,
  getStripePriceId,
} from "@/lib/stripe";
import { getSafeReturnUrl } from "@/lib/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidPlan(plan: unknown): plan is Exclude<SubscriptionPlan, null> {
  return plan === "monthly" || plan === "yearly";
}

export async function POST(request: NextRequest) {
  const { user, response } = await getRequestUser(request);

  if (!user) {
    return apiError("unauthorized", "You must be logged in.", 401, response);
  }

  const body = await readJson<unknown>(request);
  if (!isRecord(body) || !isValidPlan(body.plan) || typeof body.returnUrl !== "string") {
    return apiError("invalid_request", "Invalid checkout payload.", 400, response);
  }

  await ensureUserProfile(user.id, user.email ?? null);

  const customerId = await getOrCreateStripeCustomer(user.id, user.email ?? null);
  const stripe = getStripeClient();
  const safeReturnUrl = getSafeReturnUrl(body.returnUrl, request.nextUrl.origin);

  if (!safeReturnUrl) {
    return apiError("invalid_return_url", "Return URL must stay on this site.", 400, response);
  }

  const successUrl = new URL(safeReturnUrl);
  successUrl.searchParams.set("checkout", "success");
  const cancelUrl = new URL(safeReturnUrl);
  cancelUrl.searchParams.set("checkout", "canceled");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: getStripePriceId(body.plan), quantity: 1 }],
    success_url: successUrl.toString(),
    cancel_url: cancelUrl.toString(),
    metadata: { userId: user.id, plan: body.plan },
    subscription_data: {
      metadata: {
        userId: user.id,
        plan: body.plan,
      },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return apiError("stripe_checkout_failed", "Stripe did not return a checkout URL.", 500, response);
  }

  return apiSuccess({ checkoutUrl: session.url }, response);
}
