import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import type {
  DbCuratedTrack,
  DbGeneration,
  DbSavedTrack,
  DbUser,
} from "@/types/db";
import { getRequiredEnv } from "@/lib/env";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: DbUser;
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          subscription_status?: DbUser["subscription_status"];
          subscription_plan?: DbUser["subscription_plan"];
          subscription_end?: string | null;
          generation_credits_used?: number;
          voice_clone_credits_used?: number;
          stripe_customer_id?: string | null;
          creem_customer_id?: string | null;
          creem_subscription_id?: string | null;
          created_at?: string;
        };
        Update: Partial<DbUser>;
        Relationships: [];
      };
      generations: {
        Row: DbGeneration;
        Insert: {
          id?: string;
          user_id: string;
          mode: DbGeneration["mode"];
          prompt_input: DbGeneration["prompt_input"];
          script_text?: string | null;
          duration_minutes: DbGeneration["duration_minutes"];
          voice_id: string;
          music_track_id: string;
          status?: DbGeneration["status"];
          audio_url?: string | null;
          error_code?: string | null;
          created_at?: string;
        };
        Update: Partial<DbGeneration>;
        Relationships: [];
      };
      saved_tracks: {
        Row: DbSavedTrack;
        Insert: {
          id?: string;
          user_id: string;
          generation_id: string;
          title: string;
          storage_path: string;
          duration_seconds: number;
          created_at?: string;
        };
        Update: Partial<DbSavedTrack>;
        Relationships: [];
      };
      curated_tracks: {
        Row: DbCuratedTrack;
        Insert: {
          id?: string;
          title: string;
          slug: string;
          full_audio_path: string;
          preview_audio_path: string;
          transcript_path?: string | null;
          duration_seconds: number;
          sort_order?: number;
        };
        Update: Partial<DbCuratedTrack>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

function getSupabaseConfig() {
  return {
    supabaseUrl: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function createBrowserSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components may not be allowed to set cookies during render.
        }
      },
    },
  });
}

export function createRouteHandlerSupabaseClient(
  request: NextRequest,
  response?: NextResponse,
) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const nextResponse = response ?? NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          nextResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, response: nextResponse };
}

export function createMiddlewareSupabaseClient(request: NextRequest) {
  return createRouteHandlerSupabaseClient(request);
}

export function createAdminSupabaseClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseConfig();
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
