import { NextRequest, NextResponse } from "next/server";

import { isRecord } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENT_NAME_PATTERN = /^[a-z0-9_.:-]{1,80}$/i;

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.event !== "string" || !EVENT_NAME_PATTERN.test(body.event)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const properties = isRecord(body.properties) ? body.properties : {};

  console.info("analytics_event", {
    event: body.event,
    properties,
    path: typeof body.path === "string" ? body.path : null,
    ts: typeof body.ts === "string" ? body.ts : new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
