export function getSafeInternalPath(
  raw: string | null | undefined,
  fallback = "/",
) {
  if (!raw) {
    return fallback;
  }

  try {
    const candidate = new URL(raw, "http://codex.local");

    if (candidate.origin !== "http://codex.local") {
      return fallback;
    }

    if (!candidate.pathname.startsWith("/")) {
      return fallback;
    }

    return `${candidate.pathname}${candidate.search}${candidate.hash}`;
  } catch {
    return fallback;
  }
}

export function getSafeReturnUrl(raw: string, origin: string) {
  try {
    const base = new URL(origin);
    const candidate = new URL(raw, base);

    if (candidate.origin !== base.origin) {
      return null;
    }

    return new URL(
      `${candidate.pathname}${candidate.search}${candidate.hash}`,
      base,
    ).toString();
  } catch {
    return null;
  }
}
