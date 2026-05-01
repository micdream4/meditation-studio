import { createClient } from "@supabase/supabase-js";

import { getMissingEnv, loadLocalEnv } from "./env-utils.ts";

loadLocalEnv();

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const tableChecks = [
  {
    table: "users",
    select:
      "id,email,subscription_status,subscription_plan,subscription_end,generation_credits_used,voice_clone_credits_used,stripe_customer_id,creem_customer_id,creem_subscription_id,created_at",
  },
  {
    table: "generations",
    select:
      "id,user_id,mode,prompt_input,script_text,duration_minutes,voice_id,music_track_id,status,audio_url,error_code,created_at",
  },
  {
    table: "saved_tracks",
    select:
      "id,user_id,generation_id,title,storage_path,duration_seconds,created_at",
  },
  {
    table: "curated_tracks",
    select:
      "id,title,slug,full_audio_path,preview_audio_path,transcript_path,duration_seconds,sort_order",
  },
] as const;

const missingEnv = getMissingEnv(requiredEnv);
if (missingEnv.length > 0) {
  console.error("Missing required Supabase environment variables:");
  for (const key of missingEnv) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
const schemaClient = supabase as ReturnType<typeof createClient>;

let hasFailure = false;

for (const check of tableChecks) {
  const { error } = await schemaClient
    .from(check.table)
    .select(check.select)
    .limit(1);

  if (error) {
    hasFailure = true;
    console.error(`${check.table}: FAIL ${error.code ?? ""} ${error.message}`);
  } else {
    console.log(`${check.table}: OK`);
  }
}

if (hasFailure) {
  console.error("");
  console.error("If public.users.generation_credits_used is missing, run this in Supabase SQL Editor:");
  console.error("");
  console.error("alter table public.users");
  console.error("  add column if not exists generation_credits_used integer not null default 0;");
  console.error("");
  console.error("update public.users");
  console.error("set generation_credits_used = 0");
  console.error("where generation_credits_used is null;");
  process.exit(1);
}

console.log("Supabase remote schema matches the app contract.");
