import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react-native";
import { CircleAlert, Inbox } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "onBrand" | "outlineOnBrand";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: LucideIcon;
  iconFilled?: boolean;
};

function iconColor(variant: NonNullable<Props["variant"]>) {
  if (variant === "outline" || variant === "secondary" || variant === "onBrand") return "#1D4ED8";
  if (variant === "outlineOnBrand") return "#FFFFFF";
  return "#FFFFFF";
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  className = "",
  icon: Icon,
  iconFilled,
}: Props) {
  const base = "flex-row items-center justify-center gap-2 rounded-xl px-4 py-3.5";
  const variants = {
    primary: "bg-brand-600 active:bg-brand-700",
    secondary: "bg-brand-100 active:bg-brand-200",
    outline: "border border-ink-200 bg-white active:bg-ink-50",
    danger: "bg-red-600 active:bg-red-700",
    onBrand: "bg-white active:bg-brand-50",
    outlineOnBrand: "border border-white bg-transparent active:bg-white/10",
  };
  const labels = {
    primary: "text-white font-semibold",
    secondary: "text-brand-700 font-semibold",
    outline: "text-ink-900 font-semibold",
    danger: "text-white font-semibold",
    onBrand: "text-brand-700 font-semibold",
    outlineOnBrand: "text-white font-semibold",
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      className={`${base} ${variants[variant]} ${disabled || loading ? "opacity-50" : ""} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={iconColor(variant)} />
      ) : (
        <>
          {Icon ? (
            <Icon
              size={18}
              color={iconColor(variant)}
              fill={iconFilled ? iconColor(variant) : "transparent"}
              strokeWidth={iconFilled ? 0 : 2.25}
            />
          ) : null}
          <Text className={labels[variant]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function ScreenState({
  loading,
  error,
  empty,
  emptyMessage = "Nothing here yet",
  emptyIcon: EmptyIcon = Inbox,
  onRetry,
  children,
}: {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  emptyIcon?: LucideIcon;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }
  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-16">
        <CircleAlert size={36} color="#64748B" strokeWidth={1.75} />
        <Text className="text-center text-base text-ink-700">{error}</Text>
        {onRetry ? <Button label="Try again" onPress={onRetry} /> : null}
      </View>
    );
  }
  if (empty) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6 py-16">
        <EmptyIcon size={40} color="#94A3B8" strokeWidth={1.75} />
        <Text className="text-center text-base text-ink-500">{emptyMessage}</Text>
      </View>
    );
  }
  return <>{children}</>;
}
