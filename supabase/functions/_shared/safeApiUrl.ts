// Validates a user-supplied AI provider base URL to prevent SSRF.
// Only https URLs pointing at known AI provider hosts are allowed.

const ALLOWED_HOST_SUFFIXES = [
  "api.openai.com",
  "generativelanguage.googleapis.com",
  "ai.gateway.lovable.dev",
  "openrouter.ai",
  "api.anthropic.com",
  "api.mistral.ai",
  "api.groq.com",
  "api.deepseek.com",
  "api.together.xyz",
  "api.x.ai",
  "api.cohere.com",
  "openai.azure.com",
];

export function isSafeApiBaseUrl(rawUrl: string | null | undefined): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  if (url.port && url.port !== "443") return false;

  const host = url.hostname.toLowerCase();

  // Never allow raw IPs, localhost, or internal-looking hosts.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  if (host.includes(":")) return false; // IPv6 literal
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (!host.includes(".")) return false;

  return ALLOWED_HOST_SUFFIXES.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`),
  );
}

export function sanitizeApiBaseUrl(
  rawUrl: string | null | undefined,
  fallback: string,
): string {
  if (isSafeApiBaseUrl(rawUrl)) return (rawUrl as string).trim();
  if (rawUrl) {
    console.warn("Rejected custom AI base URL (not on provider allowlist)");
  }
  return fallback;
}
