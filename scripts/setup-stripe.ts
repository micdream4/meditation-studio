import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";

const PRODUCT_NAME = "Meditation Studio";
const PRODUCT_METADATA = {
  app: "meditation-studio",
  entitlement: "generation_credits",
};

const PRICE_CONFIG = {
  monthly: {
    envKey: "STRIPE_MONTHLY_PRICE_ID",
    amount: 1900,
    interval: "month" as const,
    credits: "30",
  },
  yearly: {
    envKey: "STRIPE_YEARLY_PRICE_ID",
    amount: 15900,
    interval: "year" as const,
    credits: "300",
  },
};

function loadEnv(filename: string) {
  const filePath = resolve(process.cwd(), filename);
  if (!existsSync(filePath)) return new Map<string, string>();

  const entries = new Map<string, string>();
  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries.set(key, value);
  }

  return entries;
}

function updateEnvFile(filename: string, updates: Record<string, string>) {
  const filePath = resolve(process.cwd(), filename);
  const existing = existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
  let next = existing;

  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    if (pattern.test(next)) {
      next = next.replace(pattern, line);
    } else {
      next = `${next.trimEnd()}\n${line}\n`;
    }
  }

  writeFileSync(filePath, next);
}

async function getOrCreateProduct(stripe: Stripe) {
  const products = await stripe.products.list({ active: true, limit: 100 });
  const existing = products.data.find(
    (product) => product.metadata.app === PRODUCT_METADATA.app,
  );

  if (existing) {
    return existing;
  }

  return stripe.products.create({
    name: PRODUCT_NAME,
    description: "AI-guided meditation generation credits.",
    metadata: PRODUCT_METADATA,
  });
}

async function getOrCreatePrice(
  stripe: Stripe,
  productId: string,
  plan: keyof typeof PRICE_CONFIG,
) {
  const config = PRICE_CONFIG[plan];
  const prices = await stripe.prices.list({
    active: true,
    product: productId,
    limit: 100,
  });

  const existing = prices.data.find(
    (price) =>
      price.metadata.plan === plan &&
      price.unit_amount === config.amount &&
      price.currency === "usd" &&
      price.recurring?.interval === config.interval,
  );

  if (existing) {
    return existing;
  }

  return stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: config.amount,
    recurring: { interval: config.interval },
    nickname: `${PRODUCT_NAME} ${plan}`,
    metadata: {
      plan,
      credits: config.credits,
      app: PRODUCT_METADATA.app,
    },
  });
}

async function main() {
  const env = loadEnv(".env.local");
  const stripeSecretKey = env.get("STRIPE_SECRET_KEY") || process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY in .env.local.");
  }

  const stripe = new Stripe(stripeSecretKey);
  const product = await getOrCreateProduct(stripe);
  const monthlyPrice = await getOrCreatePrice(stripe, product.id, "monthly");
  const yearlyPrice = await getOrCreatePrice(stripe, product.id, "yearly");

  const updates = {
    STRIPE_MONTHLY_PRICE_ID: monthlyPrice.id,
    STRIPE_YEARLY_PRICE_ID: yearlyPrice.id,
  };

  updateEnvFile(".env.local", updates);

  console.log("Stripe product and prices are ready.");
  console.log(`Product: ${product.id}`);
  console.log(`STRIPE_MONTHLY_PRICE_ID=${monthlyPrice.id}`);
  console.log(`STRIPE_YEARLY_PRICE_ID=${yearlyPrice.id}`);
  console.log("");
  console.log("Next manual steps:");
  console.log("1. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local.");
  console.log("2. Create or listen for a webhook and set STRIPE_WEBHOOK_SECRET.");
  console.log("3. Enable Stripe Billing Portal in the Stripe dashboard.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
