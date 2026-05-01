import { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api";
import { ensureUserProfile, getRequestUser, getUserProfile } from "@/lib/auth";
import {
  getPlanGenerationCredits,
  getRemainingGenerationCredits,
} from "@/lib/credits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { user, response } = await getRequestUser(request);

  if (!user) {
    return apiError("unauthorized", "You must be logged in.", 401, response);
  }

  await ensureUserProfile(user.id, user.email ?? null);
  const profile = await getUserProfile(user.id);

  if (!profile) {
    return apiError("profile_not_found", "User profile not found.", 404, response);
  }

  return apiSuccess(
    {
      status: profile.subscription_status,
      plan: profile.subscription_plan,
      currentPeriodEnd: profile.subscription_end,
      generationCreditsIncluded: getPlanGenerationCredits(profile.subscription_plan),
      generationCreditsUsed: profile.generation_credits_used,
      generationCreditsRemaining: getRemainingGenerationCredits(profile),
    },
    response,
  );
}
