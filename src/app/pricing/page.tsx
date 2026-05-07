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
      planPricesUsd={{
        basic: getPriceEnv("NEXT_PUBLIC_BASIC_PRICE_USD", 9.9),
        plus: getPriceEnv("NEXT_PUBLIC_PLUS_PRICE_USD", 19.9),
        pro: getPriceEnv("NEXT_PUBLIC_PRO_PRICE_USD", 29.9),
      }}
    />
  );
}
