/** ponytail: API base URL is required (no fallback) and HTTPS-only in release. */
import { resolveApiBaseUrl } from "./baseUrl";

const prev = process.env.EXPO_PUBLIC_API_BASE_URL;

// A valid HTTPS URL is returned with any trailing slash trimmed.
process.env.EXPO_PUBLIC_API_BASE_URL = "https://example.test/api/v1/";
const url = resolveApiBaseUrl();
if (url !== "https://example.test/api/v1") {
  throw new Error("baseUrl.selfcheck: expected trimmed https URL");
}

// A missing base URL must fail loudly — no silent fallback.
delete process.env.EXPO_PUBLIC_API_BASE_URL;
let threw = false;
try {
  resolveApiBaseUrl();
} catch {
  threw = true;
}
if (!threw) {
  throw new Error("baseUrl.selfcheck: expected throw when EXPO_PUBLIC_API_BASE_URL is unset");
}

// restore prior env for any later checks
if (prev === undefined) delete process.env.EXPO_PUBLIC_API_BASE_URL;
else process.env.EXPO_PUBLIC_API_BASE_URL = prev;

console.log("baseUrl.selfcheck: ok");
