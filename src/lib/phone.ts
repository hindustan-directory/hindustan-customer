import { openSafeExternalUrl } from "./safeLinking";
import { whatsAppUrl } from "./phoneFormat";

export { whatsAppUrl } from "./phoneFormat";

export function openWhatsApp(number: string) {
  openSafeExternalUrl(whatsAppUrl(number));
}

export function openTel(phone: string) {
  openSafeExternalUrl(`tel:${phone}`);
}
