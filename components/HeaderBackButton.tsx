import type { Href } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Platform, Pressable } from "react-native";
import { colors, goBackOr } from "../src/navigation/chrome";

/** Stack `headerLeft` — 44pt hit target, Lucide arrow, canGoBack fallback. */
export function HeaderBackButton({ fallback = "/(tabs)" }: { fallback?: Href }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={4}
      onPress={() => goBackOr(fallback)}
      style={{
        minWidth: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: Platform.OS === "ios" ? 4 : 0,
      }}
    >
      <ArrowLeft size={22} color={colors.brand600} strokeWidth={2.25} />
    </Pressable>
  );
}
