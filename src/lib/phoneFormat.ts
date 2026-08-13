/** Pure phone/url helpers (no React Native imports — safe for node selfchecks). */

export function whatsAppUrl(number: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}`;
}
