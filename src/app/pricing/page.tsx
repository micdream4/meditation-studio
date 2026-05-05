import { getAvailableCreemPlans, getCreemMode } from "@/lib/creem";

import PricingClient from "./PricingClient";

export const dynamic = "force-dynamic";

function getPriceEnv(key: string, fallback: number) {
  const value = process.env[key];
  if (!value) return fallback;

  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : fallback;
}

export default function PricingPage() {
  return (
    <PricingClient
      availablePlans={getAvailableCreemPlans()}
      isTestCheckout={getCreemMode() !== "live"}
      monthlyPriceUsd={getPriceEnv("NEXT_PUBLIC_MONTHLY_PRICE_USD", 19)}
      yearlyPriceUsd={getPriceEnv("NEXT_PUBLIC_YEARLY_PRICE_USD", 159)}
    />
  );
}
