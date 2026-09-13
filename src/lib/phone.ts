import { openSafeExternalUrl } from "./safeLinking";
import { whatsAppUrl } from "./phoneFormat";

export { whatsAppUrl } from "./phoneFormat";

export function openWhatsApp(number: string) {
  openSafeExternalUrl(whatsAppUrl(number));
}

export function openTel(phone: string) {
  // Strip to digits and `+` only before building the URI, mirroring the
  // WhatsApp sanitization in `whatsAppUrl` — keeps `tel:` well-formed.
  openSafeExternalUrl(`tel:${phone.replace(/[^\d+]/g, "")}`);
}
