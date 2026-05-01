import { NextRequest } from "next/server";

import { createAdminSupabaseClient, createRouteHandlerSupabaseClient } from "@/lib/supabase";

export async function getRequestUser(request: NextRequest) {
  const { supabase, response } = createRouteHandlerSupabaseClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return {
    user,
    error,
    response,
    supabase,
  };
}

export async function getUserProfile(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function ensureUserProfile(userId: string, email: string | null) {
  const admin = createAdminSupabaseClient();
  const { data: existing, error: selectError } = await admin
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existing) {
    if (email && existing.email !== email) {
      const { error: updateError } = await admin
        .from("users")
        .update({ email })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }
    }

    return existing;
  }

  const { data, error } = await admin
    .from("users")
    .insert({
      id: userId,
      email: email ?? "",
      subscription_status: "inactive",
      subscription_plan: null,
      subscription_end: null,
      generation_credits_used: 0,
      voice_clone_credits_used: 0,
      stripe_customer_id: null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
