const COOKIE_NAME = "ketsu_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function env(key: string): string | undefined {
  return process.env[key];
}

async function getExpectedHash(): Promise<string | null> {
  const pw = env("KETSU_PASSWORD");
  if (!pw) return null;
  const encoder = new TextEncoder();
  const data = encoder.encode(pw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate Set-Cookie header for a successful authentication.
 */
export async function createAuthCookie(): Promise<string> {
  const hash = await getExpectedHash();
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
 */
export async function isAuthenticated(request: Request): Promise<boolean> {
  const expectedHash = await getExpectedHash();
  if (!expectedHash) return false;

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return false;

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
