/**
 * Validates `next` from query params for post-login redirect.
 * Rejects open redirects and login/register loops.
 */
export function safeNextPath(next: string | null): string | undefined {
  if (next == null || next === "") return undefined;
  let decoded: string;
  try {
    decoded = decodeURIComponent(next.trim());
  } catch {
    return undefined;
  }
  if (decoded === "") return undefined;
  if (decoded.includes("..")) return undefined;
  try {
    const url = new URL(decoded, "https://internal.invalid");
    if (url.origin !== "https://internal.invalid") return undefined;
    const path = `${url.pathname}${url.search}`;
    if (!path.startsWith("/") || path.startsWith("//")) return undefined;
    const p = url.pathname;
    if (p.startsWith("/login") || p.startsWith("/register")) return undefined;
    return path;
  } catch {
    return undefined;
  }
}
