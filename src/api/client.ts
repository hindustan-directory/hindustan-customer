import * as SecureStore from "expo-secure-store";
import type { ApiEnvelope, ApiErrorBody } from "./types";

const DEFAULT_API_BASE_URL = "http://192.168.1.76:4000/api/v1";
const REFRESH_TOKEN_KEY = "hd_customer_refresh_token";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_TRANSIENT_RETRIES = 3;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  DEFAULT_API_BASE_URL;

/** Access token stays in memory only (OWASP-JWT / AGENTS.md). */
let accessToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setOnSessionExpired(handler: (() => void) | null) {
  onSessionExpired = handler;
}

export async function persistRefreshToken(token: string | null) {
  if (token) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
}

export async function readRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.code = body.code;
    this.status = status;
    this.fieldErrors = body.details?.fieldErrors ?? {};
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
  /** Skip refresh+retry on 401 (used by refresh itself). */
  skipRefresh?: boolean;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(
    path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientStatus(status: number) {
  return status === 429 || status === 502 || status === 503;
}

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await readRefreshToken();
    if (!refreshToken) return false;

    try {
      const data = await apiRequest<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }>("/auth/refresh", {
        method: "POST",
        body: { refreshToken },
        auth: false,
        skipRefresh: true,
      });
      setAccessToken(data.accessToken);
      await persistRefreshToken(data.refreshToken);
      return true;
    } catch {
      setAccessToken(null);
      await persistRefreshToken(null);
      onSessionExpired?.();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    query,
    auth = false,
    skipRefresh = false,
  } = options;

  let attempt = 0;
  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (body !== undefined) headers["Content-Type"] = "application/json";
      if (auth && accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(buildUrl(path, query), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      let envelope: ApiEnvelope<T> | null = null;
      try {
        envelope = (await response.json()) as ApiEnvelope<T>;
      } catch {
        envelope = null;
      }

      if (
        response.status === 401 &&
        auth &&
        !skipRefresh &&
        envelope &&
        !envelope.success &&
        envelope.error.code === "UNAUTHENTICATED"
      ) {
        const refreshed = await tryRefresh();
        if (refreshed) {
          return apiRequest<T>(path, { ...options, skipRefresh: true });
        }
        throw new ApiError(401, envelope.error);
      }

      if (!envelope || typeof envelope.success !== "boolean") {
        if (isTransientStatus(response.status) && attempt < MAX_TRANSIENT_RETRIES) {
          attempt += 1;
          await sleep(200 * 2 ** attempt + Math.random() * 100);
          continue;
        }
        throw new ApiError(response.status, {
          code: "INTERNAL",
          message: `Unexpected response (${response.status})`,
        });
      }

      if (!envelope.success) {
        if (isTransientStatus(response.status) && attempt < MAX_TRANSIENT_RETRIES) {
          attempt += 1;
          const retryAfter = Number(response.headers.get("Retry-After"));
          await sleep(
            Number.isFinite(retryAfter) && retryAfter > 0
              ? retryAfter * 1000
              : 200 * 2 ** attempt + Math.random() * 100,
          );
          continue;
        }
        throw new ApiError(response.status, envelope.error);
      }

      return envelope.data;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (attempt < MAX_TRANSIENT_RETRIES) {
        attempt += 1;
        await sleep(200 * 2 ** attempt + Math.random() * 100);
        continue;
      }
      throw new ApiError(0, {
        code: "NETWORK",
        message: err instanceof Error ? err.message : "Network request failed",
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
