import type { DbUser } from "@/types/db";
import type { GenerateRequest, SubscriptionPlan } from "@/types/api";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const PLAN_GENERATION_CREDITS: Record<Exclude<SubscriptionPlan, null>, number> = {
  monthly: 30,
  yearly: 300,
};

export function getGenerationCreditCost(input: GenerateRequest["input"]) {
  return input.durationMinutes;
}

export function getPlanGenerationCredits(plan: SubscriptionPlan) {
  if (!plan) return 0;
  return PLAN_GENERATION_CREDITS[plan];
}

export function getRemainingGenerationCredits(profile: Pick<DbUser, "subscription_plan" | "generation_credits_used">) {
  return Math.max(
    getPlanGenerationCredits(profile.subscription_plan) - profile.generation_credits_used,
    0,
  );
}

export function hasEnoughGenerationCredits(
  profile: Pick<DbUser, "subscription_plan" | "generation_credits_used">,
  cost: number,
) {
  return getRemainingGenerationCredits(profile) >= cost;
}

export async function consumeGenerationCredits(userId: string, cost: number) {
  const admin = createAdminSupabaseClient();
  const { data: profile, error: selectError } = await admin
    .from("users")
    .select("generation_credits_used")
    .eq("id", userId)
    .single();

  if (selectError) {
    throw selectError;
  }

  const { error: updateError } = await admin
    .from("users")
    .update({
      generation_credits_used: (profile.generation_credits_used ?? 0) + cost,
    })
    .eq("id", userId);

  if (updateError) {
    throw updateError;
  }
}
