import { Linking } from "react-native";
import { isDevBuild } from "./env";

/**
 * Open an external URL when the scheme is safe.
 * HTTP is allowed only in __DEV__ (local backend).
 */
export function openSafeExternalUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("tel:") || lower.startsWith("mailto:")) {
    void Linking.openURL(trimmed).catch(() => undefined);
    return;
  }

  try {
    const { protocol } = new URL(trimmed);
    if (protocol === "https:") {
      void Linking.openURL(trimmed).catch(() => undefined);
      return;
    }
    if (protocol === "http:" && isDevBuild()) {
      void Linking.openURL(trimmed).catch(() => undefined);
    }
  } catch {
    // ponytail: malformed URL — do not open
  }
}
