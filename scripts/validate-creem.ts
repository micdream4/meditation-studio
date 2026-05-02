import { getMissingEnv, loadLocalEnv } from "./env-utils.ts";

loadLocalEnv();

const requiredEnv =
  process.env.CREEM_MODE === "live"
    ? (process.env.CREEM_LIVE_API_KEY || process.env.CREEM_LIVE_WEBHOOK_SECRET
        ? (["CREEM_LIVE_API_KEY", "CREEM_LIVE_WEBHOOK_SECRET"] as const)
        : (["CREEM_API_KEY", "CREEM_WEBHOOK_SECRET"] as const))
    : (process.env.CREEM_TEST_API_KEY || process.env.CREEM_TEST_WEBHOOK_SECRET
        ? (["CREEM_TEST_API_KEY", "CREEM_TEST_WEBHOOK_SECRET"] as const)
        : (["CREEM_API_KEY", "CREEM_WEBHOOK_SECRET"] as const));

const requiredProductEnv =
  process.env.CREEM_MODE === "live"
    ? (["CREEM_MONTHLY_PRODUCT_ID"] as const)
    : (["CREEM_TEST_PRODUCT_ID"] as const);

const missingEnv = getMissingEnv([...requiredEnv, ...requiredProductEnv]);
if (missingEnv.length > 0) {
  console.error("Missing required Creem environment variables:");
  for (const key of missingEnv) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log("Creem environment variables are present.");
