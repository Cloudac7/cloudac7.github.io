import { createHash } from "node:crypto";

const COOKIE_NAME = "ketsu_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Read env vars robustly across dev (Astro/Vite proxy) and prod (Vercel).
 *
 * In dev, Astro's Vite module runner wraps import.meta.env in a Proxy that
 * ONLY supports static access (import.meta.env.KEY).  We use static top-level
 * access here, then fall back to process.env for Vercel production.
 */
const _KETSU_PASSWORD = import.meta.env.KETSU_PASSWORD;

export function env(key: string): string | undefined {
  if (key === "KETSU_PASSWORD") return _KETSU_PASSWORD ?? process.env.KETSU_PASSWORD;
  return process.env[key];
}

function getExpectedHash(): string | null {
  const pw = env("KETSU_PASSWORD");
  if (!pw) return null;
  return createHash("sha256").update(pw).digest("hex");
}

/**
 * Generate Set-Cookie header for a successful authentication.
 * Cookie is HttpOnly, Secure, SameSite=Strict, Path=/ketsu/, 7-day expiry.
 */
export function createAuthCookie(): string {
  const hash = getExpectedHash();
  if (!hash) throw new Error("KETSU_PASSWORD env var is not set");
  return `${COOKIE_NAME}=${hash}; Path=/ketsu/; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`;
}

/**
 * Generate Set-Cookie header to clear the auth cookie (logout).
 */
export function clearAuthCookie(): string {
  return `${COOKIE_NAME}=; Path=/ketsu/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

/**
 * Check whether the incoming request carries a valid auth cookie.
 * Compares the cookie value against SHA-256(KETSU_PASSWORD).
 */
export function isAuthenticated(request: Request): boolean {
  const expectedHash = getExpectedHash();
  if (!expectedHash) return false;

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return false;

  // Manual cookie parse – no dependency needed for this simple case.
  const cookies = cookieHeader.split(";").reduce<Record<string, string>>((acc, pair) => {
    const idx = pair.indexOf("=");
    if (idx > 0) {
      const key = pair.substring(0, idx).trim();
      const val = pair.substring(idx + 1).trim();
      acc[key] = val;
    }
    return acc;
  }, {});

  return cookies[COOKIE_NAME] === expectedHash;
}
