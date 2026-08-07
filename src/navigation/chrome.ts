import type { Href } from "expo-router";
import { router } from "expo-router";

/** Brand / ink tokens (mirror tailwind.config.js) — not milk green. */
export const colors = {
  brand600: "#2563EB",
  ink50: "#F8FAFC",
  ink100: "#F1F5F9",
  ink400: "#94A3B8",
  ink900: "#0F172A",
  white: "#FFFFFF",
} as const;

/** Pop when possible; otherwise replace so users are never trapped. */
export function goBackOr(fallback: Href = "/(tabs)") {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}

/** Shared look for every pushed Stack screen with a header. */
export const pushedHeaderOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.white },
  headerShadowVisible: false,
  headerTitleStyle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: colors.ink900,
  },
  headerTintColor: colors.brand600,
  headerTitleAlign: "center" as const,
  headerBackVisible: false,
  contentStyle: { backgroundColor: colors.ink50 },
};
