import { isDevBuild } from "../lib/env";

/**
 * API base URL — REQUIRED via EXPO_PUBLIC_API_BASE_URL (set in `.env` for local
 * dev, or the EAS env for builds). There is no hardcoded fallback: a missing
 * value fails loudly at startup rather than silently pointing at a stale host.
 * Cleartext HTTP is never permitted in release builds (the app is HTTPS-only).
 */
export function resolveApiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "");

  if (!url) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL is not set. Define it in .env (e.g. https://hindustandirectory.online/api/v1).",
    );
  }

  if (!isDevBuild() && url.startsWith("http://")) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL must use HTTPS in release builds.");
  }

  return url;
}
