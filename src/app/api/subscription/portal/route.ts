import { NextRequest } from "next/server";

import { apiError, apiSuccess, isRecord, readJson } from "@/lib/api";
import { ensureUserProfile, getRequestUser, getUserProfile } from "@/lib/auth";
import { getOrCreateStripeCustomer, getStripeClient } from "@/lib/stripe";
import { getSafeReturnUrl } from "@/lib/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { user, response } = await getRequestUser(request);

  if (!user) {
    return apiError("unauthorized", "You must be logged in.", 401, response);
  }

  const body = await readJson<unknown>(request);
  if (!isRecord(body) || typeof body.returnUrl !== "string") {
    return apiError("invalid_request", "Invalid portal payload.", 400, response);
  }

  await ensureUserProfile(user.id, user.email ?? null);
  const profile = await getUserProfile(user.id);
  const stripe = getStripeClient();
  const customerId =
    profile?.stripe_customer_id ??
    (await getOrCreateStripeCustomer(user.id, user.email ?? null));
  const safeReturnUrl = getSafeReturnUrl(body.returnUrl, request.nextUrl.origin);

  if (!safeReturnUrl) {
    return apiError("invalid_return_url", "Return URL must stay on this site.", 400, response);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: safeReturnUrl,
  });

  return apiSuccess({ portalUrl: session.url }, response);
}
