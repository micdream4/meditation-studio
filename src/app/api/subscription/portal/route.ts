import { NextRequest } from "next/server";

import { apiError, apiSuccess, isRecord, readJson } from "@/lib/api";
import { ensureUserProfile, getRequestUser, getUserProfile } from "@/lib/auth";
import { createCreemCustomerPortalLink } from "@/lib/creem";
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

  let customerId: string | null | undefined;
  try {
    await ensureUserProfile(user.id, user.email ?? null);
    const profile = await getUserProfile(user.id);
    customerId = profile?.creem_customer_id;
  } catch (error) {
    throw error;
  }

  if (!customerId) {
    return apiError(
      "billing_customer_not_found",
      "Billing portal is available after your first successful Creem checkout.",
      409,
      response,
    );
  }

  const safeReturnUrl = getSafeReturnUrl(body.returnUrl, request.nextUrl.origin);

  if (!safeReturnUrl) {
    return apiError("invalid_return_url", "Return URL must stay on this site.", 400, response);
  }

  let portalUrl: string;
  try {
    portalUrl = await createCreemCustomerPortalLink(customerId);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Missing required environment variable:")
    ) {
      return apiError(
        "creem_not_configured",
        "Creem is not configured yet. Add Creem API key before opening the billing portal.",
        503,
        response,
      );
    }

    throw error;
  }

  return apiSuccess({ portalUrl }, response);
}
