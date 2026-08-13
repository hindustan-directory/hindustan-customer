import type { Href } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, Text } from "react-native";
import { colors, goBackOr } from "../src/navigation/chrome";

/** In-screen back (auth etc.) when Stack header is hidden. */
export function BackButton({
  label = "Back",
  fallback = "/(auth)/welcome",
  onDark = false,
}: {
  label?: string;
  fallback?: Href;
  onDark?: boolean;
}) {
  const tint = onDark ? colors.white : colors.brand600;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => goBackOr(fallback)}
      className="min-h-[44px] flex-row items-center gap-1.5 self-start active:opacity-70"
      hitSlop={8}
    >
      <ArrowLeft size={22} color={tint} strokeWidth={2.25} />
      <Text className={`text-base font-medium ${onDark ? "text-white" : "text-brand-600"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
