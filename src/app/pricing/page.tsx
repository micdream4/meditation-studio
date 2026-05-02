import { getCreemMode } from "@/lib/creem";

import PricingClient from "./PricingClient";

export const dynamic = "force-dynamic";

export default function PricingPage() {
  return <PricingClient isTestCheckout={getCreemMode() !== "live"} />;
}
