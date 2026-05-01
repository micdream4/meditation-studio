import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";

function buildResponseInit(base?: ResponseInit | NextResponse): ResponseInit | undefined {
  if (!base || base instanceof NextResponse) {
    return undefined;
  }

  return base;
}

function copyCookies(target: NextResponse, source?: ResponseInit | NextResponse) {
  if (!(source instanceof NextResponse)) {
    return target;
  }

  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });

  return target;
}

export function apiSuccess<T>(data: T, init?: ResponseInit | NextResponse) {
  const response = NextResponse.json<ApiResponse<T>>(
    { success: true, data },
    buildResponseInit(init),
  );

  return copyCookies(response, init);
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  init?: ResponseInit | NextResponse,
) {
  const response = NextResponse.json<ApiResponse<never>>(
    { success: false, error: { code, message } },
    { status, ...buildResponseInit(init) },
  );

  return copyCookies(response, init);
}

export async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
