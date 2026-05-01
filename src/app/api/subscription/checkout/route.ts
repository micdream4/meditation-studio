import { NextRequest } from "next/server";

import type { SubscriptionPlan } from "@/types/api";
import { apiError, apiSuccess, isRecord, readJson } from "@/lib/api";
import { ensureUserProfile, getRequestUser } from "@/lib/auth";
import { createCreemCheckoutSession } from "@/lib/creem";
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

  try {
    await ensureUserProfile(user.id, user.email ?? null);
  } catch (error) {
    throw error;
  }

  const safeReturnUrl = getSafeReturnUrl(body.returnUrl, request.nextUrl.origin);

  if (!safeReturnUrl) {
    return apiError("invalid_return_url", "Return URL must stay on this site.", 400, response);
  }

  const successUrl = new URL(safeReturnUrl);
  successUrl.searchParams.set("checkout", "success");

  let checkoutUrl: string;
  try {
    checkoutUrl = await createCreemCheckoutSession({
      userId: user.id,
      email: user.email ?? null,
      plan: body.plan,
      successUrl: successUrl.toString(),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Missing required environment variable:")
    ) {
      return apiError(
        "creem_not_configured",
        "Creem is not configured yet. Add Creem API key and Product IDs before testing checkout.",
        503,
        response,
      );
    }

    throw error;
  }

  return apiSuccess({ checkoutUrl }, response);
}
