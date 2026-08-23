import { isDevBuild } from "../lib/env";

/** Staging/production default — HTTPS only. Override via EXPO_PUBLIC_API_BASE_URL in .env. */
const DEFAULT_API_BASE_URL = "https://13.204.231.151/api/v1";

export function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "");
  const url = fromEnv || DEFAULT_API_BASE_URL;
  const allowCleartext = process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT === "true";

  if (!isDevBuild() && url.startsWith("http://") && !allowCleartext) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL must use HTTPS in release builds, or set EXPO_PUBLIC_ALLOW_CLEARTEXT=true for staging sideload APKs.",
    );
  }

  return url;
}
