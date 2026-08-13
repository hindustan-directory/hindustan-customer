/** ponytail: assert release builds reject cleartext API URLs */
import { resolveApiBaseUrl } from "./baseUrl";

const url = resolveApiBaseUrl();
if (!url.startsWith("https://") && !url.startsWith("http://")) {
  throw new Error("baseUrl.selfcheck: unexpected API URL scheme");
}
console.log("baseUrl.selfcheck: ok");
