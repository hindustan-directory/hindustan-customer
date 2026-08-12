import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { accentFor, initial } from "./accent";

export function AccentAvatar({
  accentKey,
  label,
  size = "md",
}: {
  accentKey: string;
  label: string;
  size?: "sm" | "md";
}) {
  const accent = accentFor(accentKey);
  const dims = size === "sm" ? "h-11 w-11" : "h-14 w-14";
  const textSize = size === "sm" ? "text-lg" : "text-xl";

  return (
    <View
      className={`${dims} items-center justify-center rounded-2xl border border-white ${accent.avatar}`}
    >
      <Text className={`${textSize} font-bold ${accent.avatarText}`}>
        {initial(label)}
      </Text>
    </View>
  );
}

type AccentCardProps = {
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  onPress?: () => void;
};

export function AccentCard({
  footer,
  className = "",
  bodyClassName = "p-4",
  children,
  onPress,
}: AccentCardProps) {
  const shell = (
    <View
      className={`overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm ${className}`}
    >
      <View className={bodyClassName}>{children}</View>
      {footer ? (
        <View className="border-t border-ink-100 bg-ink-50/80 px-4 py-3">{footer}</View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-95">
        {shell}
      </Pressable>
    );
  }

  return shell;
}

export function AccentPill({
  accentKey,
  label,
}: {
  accentKey: string;
  label: string;
}) {
  const accent = accentFor(accentKey);

  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${accent.pill}`}>
      <Text className={`text-[11px] font-bold uppercase tracking-wide ${accent.pillText}`}>
        {label}
      </Text>
    </View>
  );
}

export function SecondaryAction({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className="self-start rounded-xl border border-ink-200 bg-white px-3 py-2 active:bg-ink-100 disabled:opacity-50"
    >
      <Text className="text-xs font-semibold text-ink-600">{label}</Text>
    </Pressable>
  );
}
