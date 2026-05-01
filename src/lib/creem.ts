import { createHmac, timingSafeEqual } from "node:crypto";

import type { SubscriptionPlan, SubscriptionStatus } from "@/types/api";
import { getOptionalEnv, getRequiredEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase";

type CreemMode = "test" | "live";

type CreemCustomer = {
  id?: string;
  email?: string;
};

type CreemProduct = {
  id?: string;
};

type CreemSubscription = {
  id?: string;
  customer?: string | CreemCustomer;
  product?: string | CreemProduct;
  status?: string;
  current_period_end_date?: string | null;
  metadata?: Record<string, unknown> | null;
};

type CreemCheckoutObject = {
  id?: string;
  customer?: CreemCustomer;
  product?: CreemProduct;
  subscription?: CreemSubscription | null;
  metadata?: Record<string, unknown> | null;
  request_id?: string;
};

export type CreemWebhookEvent = {
  id?: string;
  eventType?: string;
  object?: CreemCheckoutObject | CreemSubscription;
};

type CreemCheckoutResponse = {
  checkout_url?: string;
};

type CreemPortalResponse = {
  customer_portal_link?: string;
};

function getCreemMode(): CreemMode {
  return getOptionalEnv("CREEM_MODE", "test") === "live" ? "live" : "test";
}

export function getCreemBaseUrl() {
  return getCreemMode() === "live"
    ? "https://api.creem.io/v1"
    : "https://test-api.creem.io/v1";
}

function getCreemEnv() {
  return {
    apiKey: getRequiredEnv("CREEM_API_KEY"),
    testProductId: getOptionalEnv("CREEM_TEST_PRODUCT_ID"),
    monthlyProductId: getOptionalEnv("CREEM_MONTHLY_PRODUCT_ID"),
    yearlyProductId: getOptionalEnv("CREEM_YEARLY_PRODUCT_ID"),
  };
}

async function creemRequest<T>(
  path: string,
  init: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
  } = {},
): Promise<T> {
  const { apiKey } = getCreemEnv();
  const response = await fetch(`${getCreemBaseUrl()}${path}`, {
    method: init.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) as T : ({} as T);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String((data as { message?: unknown }).message)
        : `Creem request failed with HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export function getCreemProductId(plan: Exclude<SubscriptionPlan, null>) {
  const { testProductId, monthlyProductId, yearlyProductId } = getCreemEnv();
  if (getCreemMode() === "test") {
    if (!testProductId) {
      throw new Error("Missing required environment variable: CREEM_TEST_PRODUCT_ID");
    }
    return testProductId;
  }

  if (!monthlyProductId) {
    throw new Error("Missing required environment variable: CREEM_MONTHLY_PRODUCT_ID");
  }
  if (!yearlyProductId) {
    throw new Error("Missing required environment variable: CREEM_YEARLY_PRODUCT_ID");
  }

  return plan === "monthly" ? monthlyProductId : yearlyProductId;
}

export function getPlanFromCreemProductId(productId: string | null | undefined): SubscriptionPlan {
  const { monthlyProductId, yearlyProductId } = getCreemEnv();
  if (!productId) return null;
  if (monthlyProductId && productId === monthlyProductId) return "monthly";
  if (yearlyProductId && productId === yearlyProductId) return "yearly";
  return null;
}

export async function createCreemCheckoutSession({
  userId,
  email,
  plan,
  successUrl,
}: {
  userId: string;
  email: string | null;
  plan: Exclude<SubscriptionPlan, null>;
  successUrl: string;
}) {
  const data = await creemRequest<CreemCheckoutResponse>("/checkouts", {
    method: "POST",
    body: {
      product_id: getCreemProductId(plan),
      request_id: `${userId}:${plan}:${Date.now()}`,
      units: 1,
      success_url: successUrl,
      customer: email ? { email } : undefined,
      metadata: {
        userId,
        plan,
        internal_customer_id: userId,
      },
    },
  });

  if (!data.checkout_url) {
    throw new Error("Creem did not return a checkout URL.");
  }

  return data.checkout_url;
}

export async function createCreemCustomerPortalLink(customerId: string) {
  const data = await creemRequest<CreemPortalResponse>("/customers/billing", {
    method: "POST",
    body: {
      customer_id: customerId,
    },
  });

  if (!data.customer_portal_link) {
    throw new Error("Creem did not return a customer portal link.");
  }

  return data.customer_portal_link;
}

export function verifyCreemWebhookSignature(payload: string, signature: string) {
  const secret = getRequiredEnv("CREEM_WEBHOOK_SECRET");
  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function mapCreemStatus(status: string | undefined): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
    case "scheduled_cancel":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "expired":
      return "canceled";
    default:
      return "inactive";
  }
}

function getCustomerId(value: CreemSubscription | CreemCheckoutObject) {
  const customer = value.customer;
  if (typeof customer === "string") return customer;
  return customer?.id ?? null;
}

function getProductId(value: CreemSubscription | CreemCheckoutObject) {
  const product = value.product;
  if (typeof product === "string") return product;
  return product?.id ?? null;
}

function getMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getCheckoutSubscription(value: CreemWebhookEvent["object"]) {
  if (!value || !("subscription" in value)) return null;
  return value.subscription ?? null;
}

export async function syncCreemWebhookEvent(event: CreemWebhookEvent) {
  const eventType = event.eventType;
  const object = event.object;

  if (!eventType || !object) {
    throw new Error("Invalid Creem webhook event.");
  }

  const subscription = getCheckoutSubscription(object) ?? object as CreemSubscription;
  const metadata = subscription.metadata ?? object.metadata ?? null;
  const userId =
    getMetadataString(metadata, "userId") ??
    getMetadataString(metadata, "internal_customer_id");

  if (!userId) {
    throw new Error("Creem webhook missing metadata.userId");
  }

  const productId = getProductId(subscription) ?? getProductId(object);
  const customerId = getCustomerId(subscription) ?? getCustomerId(object);
  const subscriptionId = subscription.id ?? null;
  const currentPeriodEndIso = subscription.current_period_end_date
    ? new Date(subscription.current_period_end_date).toISOString()
    : null;

  const admin = createAdminSupabaseClient();
  const { data: existingProfile, error: profileError } = await admin
    .from("users")
    .select("subscription_end")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const nextStatus = eventType === "checkout.completed"
    ? mapCreemStatus(subscription.status ?? "active")
    : mapCreemStatus(subscription.status);
  const shouldResetCredits =
    Boolean(currentPeriodEndIso) &&
    existingProfile?.subscription_end !== currentPeriodEndIso;

  const { error } = await admin
    .from("users")
    .update({
      creem_customer_id: customerId,
      creem_subscription_id: subscriptionId,
      subscription_status: nextStatus,
      subscription_plan:
        getPlanFromCreemProductId(productId) ??
        getMetadataString(metadata, "plan") as SubscriptionPlan,
      subscription_end: currentPeriodEndIso,
      ...(shouldResetCredits ? { generation_credits_used: 0 } : {}),
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}
