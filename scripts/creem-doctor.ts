import { getMissingEnv, loadLocalEnv } from "./env-utils.ts";

loadLocalEnv();

type CheckStatus = "ok" | "warn" | "fail";

function printCheck(status: CheckStatus, label: string, detail?: string) {
  const prefix = status === "ok" ? "OK" : status === "warn" ? "WARN" : "FAIL";
  console.log(`[${prefix}] ${label}${detail ? ` - ${detail}` : ""}`);
}

function mask(value: string | undefined) {
  if (!value) return "<missing>";
  if (value.length <= 10) return "<set>";
  return `${value.slice(0, 7)}...${value.slice(-4)}`;
}

function getBaseUrl() {
  return process.env.CREEM_MODE === "live"
    ? "https://api.creem.io/v1"
    : "https://test-api.creem.io/v1";
}

function getCreemApiKey() {
  if (process.env.CREEM_MODE === "live") {
    return process.env.CREEM_LIVE_API_KEY || process.env.CREEM_API_KEY;
  }

  return process.env.CREEM_TEST_API_KEY || process.env.CREEM_API_KEY;
}

function getCreemCredentialKeys() {
  if (process.env.CREEM_MODE === "live") {
    return process.env.CREEM_LIVE_API_KEY || process.env.CREEM_LIVE_WEBHOOK_SECRET
      ? (["CREEM_LIVE_API_KEY", "CREEM_LIVE_WEBHOOK_SECRET"] as const)
      : (["CREEM_API_KEY", "CREEM_WEBHOOK_SECRET"] as const);
  }

  return process.env.CREEM_TEST_API_KEY || process.env.CREEM_TEST_WEBHOOK_SECRET
    ? (["CREEM_TEST_API_KEY", "CREEM_TEST_WEBHOOK_SECRET"] as const)
    : (["CREEM_API_KEY", "CREEM_WEBHOOK_SECRET"] as const);
}

async function checkCreemApiReachable() {
  try {
    const response = await fetch(`${getBaseUrl()}/checkouts`, {
      method: "GET",
      signal: AbortSignal.timeout(12_000),
    });

    if ([401, 403, 404, 405, 422].includes(response.status)) {
      printCheck("ok", "Creem API reachable", `received HTTP ${response.status}`);
      return true;
    }

    printCheck("warn", "Creem API reachable", `unexpected HTTP ${response.status}`);
    return true;
  } catch (error) {
    printCheck(
      "fail",
      "Creem API reachable",
      error instanceof Error ? error.message : "network request failed",
    );
    return false;
  }
}

async function checkProduct(productId: string, label: string) {
  const apiKey = getCreemApiKey();
  if (!apiKey) return false;

  try {
    const response = await fetch(
      `${getBaseUrl()}/products?product_id=${encodeURIComponent(productId)}`,
      {
      headers: {
        "x-api-key": apiKey,
      },
      signal: AbortSignal.timeout(12_000),
      },
    );

    if (!response.ok) {
      printCheck("fail", `${label} Product`, `HTTP ${response.status}`);
      return false;
    }

    printCheck("ok", `${label} Product`, productId);
    return true;
  } catch (error) {
    printCheck(
      "fail",
      `${label} Product`,
      error instanceof Error ? error.message : "request failed",
    );
    return false;
  }
}

async function main() {
  console.log("Creem doctor");
  console.log("------------");
  printCheck("ok", "Creem mode", process.env.CREEM_MODE === "live" ? "live" : "test");

  const apiReachable = await checkCreemApiReachable();
  const productEnvKeys =
    process.env.CREEM_MODE === "live"
      ? (["CREEM_MONTHLY_PRODUCT_ID"] as const)
      : (["CREEM_TEST_PRODUCT_ID"] as const);
  const credentialEnvKeys = getCreemCredentialKeys();
  const requiredEnvKeys = [...credentialEnvKeys, ...productEnvKeys] as const;
  const missing = getMissingEnv(requiredEnvKeys);

  for (const key of requiredEnvKeys) {
    if (missing.includes(key)) {
      printCheck("fail", key, "missing");
    } else {
      printCheck("ok", key, mask(process.env[key]));
    }
  }

  const webhookSecret =
    process.env.CREEM_MODE === "live"
      ? process.env.CREEM_LIVE_WEBHOOK_SECRET || process.env.CREEM_WEBHOOK_SECRET
      : process.env.CREEM_TEST_WEBHOOK_SECRET || process.env.CREEM_WEBHOOK_SECRET;

  if (webhookSecret && webhookSecret.length < 16) {
    printCheck("warn", "Creem webhook secret", "looks short; verify it came from Creem webhook settings");
  }

  let productsOk = false;
  if (process.env.CREEM_MODE === "live" && process.env.CREEM_MONTHLY_PRODUCT_ID) {
    const monthlyOk = await checkProduct(process.env.CREEM_MONTHLY_PRODUCT_ID, "Monthly");
    const yearlyOk = process.env.CREEM_YEARLY_PRODUCT_ID
      ? await checkProduct(process.env.CREEM_YEARLY_PRODUCT_ID, "Yearly")
      : true;
    if (!process.env.CREEM_YEARLY_PRODUCT_ID) {
      printCheck("warn", "Yearly Product", "not configured; yearly checkout will stay hidden");
    }
    productsOk = monthlyOk && yearlyOk;
  } else if (process.env.CREEM_MODE !== "live" && process.env.CREEM_TEST_PRODUCT_ID) {
    productsOk = await checkProduct(process.env.CREEM_TEST_PRODUCT_ID, "Test $1");
  } else {
    printCheck("warn", "Creem product checks", "skipped until Product IDs are present");
  }

  console.log("");
  if (apiReachable && missing.length === 0 && productsOk) {
    printCheck("ok", "Result", "Creem configuration is ready for checkout and webhook testing.");
    return;
  }

  printCheck("warn", "Result", "Creem is not fully ready. Fix failed checks above, then rerun npm run creem:doctor.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
