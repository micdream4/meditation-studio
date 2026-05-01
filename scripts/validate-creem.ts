import { getMissingEnv, loadLocalEnv } from "./env-utils.ts";

loadLocalEnv();

const requiredEnv = [
  "CREEM_API_KEY",
  "CREEM_WEBHOOK_SECRET",
] as const;

const requiredProductEnv =
  process.env.CREEM_MODE === "live"
    ? (["CREEM_MONTHLY_PRODUCT_ID", "CREEM_YEARLY_PRODUCT_ID"] as const)
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
