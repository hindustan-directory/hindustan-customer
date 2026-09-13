import type { Href } from "expo-router";
import { router } from "expo-router";

/** Brand / ink tokens (mirror tailwind.config.js) — not milk green. */
export const colors = {
  brand600: "#2563EB",
  brand50: "#EFF6FF",
  ink50: "#F8FAFC",
  ink100: "#F1F5F9",
  ink400: "#94A3B8",
  ink900: "#0F172A",
  white: "#FFFFFF",
} as const;

/** Floating bottom tab bar geometry — shared by (tabs)/_layout and screen content insets. */
export const FLOATING_TAB_BAR = { height: 68, sideMargin: 16, radius: 32, minBottom: 12 } as const;
/** Distance from the screen bottom to the bar's bottom edge. */
export function floatingTabBarBottom(safeBottom: number): number {
  return Math.max(safeBottom, FLOATING_TAB_BAR.minBottom);
}
/** Bottom padding a scrollable tab screen needs so its content clears the floating bar. */
export function floatingTabBarInset(safeBottom: number): number {
  return floatingTabBarBottom(safeBottom) + FLOATING_TAB_BAR.height + 12;
}

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
