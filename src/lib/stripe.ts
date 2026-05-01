import Stripe from "stripe";

import type { SubscriptionPlan, SubscriptionStatus } from "@/types/api";
import { getRequiredEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase";

let stripeInstance: Stripe | null = null;

function getStripeEnv() {
  return {
    stripeSecretKey: getRequiredEnv("STRIPE_SECRET_KEY"),
    monthlyPriceId: getRequiredEnv("STRIPE_MONTHLY_PRICE_ID"),
    yearlyPriceId: getRequiredEnv("STRIPE_YEARLY_PRICE_ID"),
  };
}

export function getStripeClient() {
  if (!stripeInstance) {
    stripeInstance = new Stripe(getStripeEnv().stripeSecretKey);
  }

  return stripeInstance;
}

export function getStripePriceId(plan: Exclude<SubscriptionPlan, null>) {
  const { monthlyPriceId, yearlyPriceId } = getStripeEnv();
  return plan === "monthly" ? monthlyPriceId : yearlyPriceId;
}

export function getPlanFromPriceId(priceId: string | null | undefined): SubscriptionPlan {
  const { monthlyPriceId, yearlyPriceId } = getStripeEnv();
  if (!priceId) {
    return null;
  }

  if (priceId === monthlyPriceId) {
    return "monthly";
  }

  if (priceId === yearlyPriceId) {
    return "yearly";
  }

  return null;
}

export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    default:
      return "inactive";
  }
}

export async function getOrCreateStripeCustomer(userId: string, email: string | null) {
  const stripe = getStripeClient();
  const admin = createAdminSupabaseClient();
  const { data: profile, error } = await admin
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  if (profile.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    metadata: { userId },
  });

  const { error: updateError } = await admin
    .from("users")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  if (updateError) {
    throw updateError;
  }

  return customer.id;
}

export async function syncStripeSubscription(subscription: Stripe.Subscription) {
  const stripe = getStripeClient();
  const admin = createAdminSupabaseClient();
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const userId = subscription.metadata.userId;

  if (!userId) {
    const customers = await stripe.customers.retrieve(customerId);
    const fallbackUserId =
      !customers.deleted ? customers.metadata.userId || null : null;

    if (!fallbackUserId) {
      throw new Error("Stripe subscription missing metadata.userId");
    }

    subscription.metadata.userId = fallbackUserId;
  }

  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price?.id ?? null;
  const subscriptionPlan = getPlanFromPriceId(priceId);
  const currentPeriodEnd = firstItem?.current_period_end ?? null;
  const currentPeriodEndIso = currentPeriodEnd
    ? new Date(currentPeriodEnd * 1000).toISOString()
    : null;

  const { data: existingProfile, error: profileError } = await admin
    .from("users")
    .select("subscription_end")
    .eq("id", subscription.metadata.userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const shouldResetCredits = existingProfile?.subscription_end !== currentPeriodEndIso;

  const { error } = await admin
    .from("users")
    .update({
      stripe_customer_id: customerId,
      subscription_status: mapStripeStatus(subscription.status),
      subscription_plan: subscriptionPlan,
      subscription_end: currentPeriodEndIso,
      ...(shouldResetCredits ? { generation_credits_used: 0 } : {}),
    })
    .eq("id", subscription.metadata.userId);

  if (error) {
    throw error;
  }
}
