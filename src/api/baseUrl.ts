import { isDevBuild } from "../lib/env";

/** Staging/production default — HTTPS only. Override via EXPO_PUBLIC_API_BASE_URL in .env. */
const DEFAULT_API_BASE_URL = "https://13.204.231.151/api/v1";

export function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "");
  const url = fromEnv || DEFAULT_API_BASE_URL;

  if (!isDevBuild() && url.startsWith("http://")) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL must use HTTPS in release builds. Set a https:// URL in EAS env.",
    );
  }

  return url;
}
