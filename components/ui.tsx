import type { ReactNode } from "react";
import { useId } from "react";
import type { LucideIcon } from "lucide-react-native";
import { CircleAlert, Inbox } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from "react-native";
import Svg, { Defs, LinearGradient as SvgGradient, Rect, Stop } from "react-native-svg";

type Props = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "onBrand" | "outlineOnBrand";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: LucideIcon;
  iconFilled?: boolean;
  /** Brand or custom icon — takes precedence over `icon`. */
  iconNode?: ReactNode;
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
  iconNode,
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
          {iconNode ?? (Icon ? (
            <Icon
              size={18}
              color={iconColor(variant)}
              fill={iconFilled ? iconColor(variant) : "transparent"}
              strokeWidth={iconFilled ? 0 : 2.25}
            />
          ) : null)}
          <Text className={labels[variant]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

/** Circular icon action — edit, assign, etc. Keep tap target 36×36 app-wide. */
export function IconActionButton({
  icon: Icon,
  onPress,
  disabled,
  accessibilityLabel,
  className = "",
}: {
  icon: LucideIcon;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  className?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      className={`h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 active:bg-brand-100 ${
        disabled ? "opacity-50" : ""
      } ${className}`}
    >
      <Icon size={16} color="#2563EB" strokeWidth={2.25} />
    </Pressable>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`rounded-2xl border border-ink-100 bg-white shadow-sm shadow-ink-900/5 ${className}`}
    >
      {children}
    </View>
  );
}

export function GradientBox({
  children,
  className = "",
  from = "#2563EB",
  to = "#1D4ED8",
  roundedBottom = true,
  style,
}: ViewProps & {
  children?: ReactNode;
  className?: string;
  from?: string;
  to?: string;
  roundedBottom?: boolean;
}) {
  const gradId = useId().replace(/:/g, "");

  return (
    <View
      className={`overflow-hidden ${roundedBottom ? "rounded-b-3xl" : ""} ${className}`}
      style={style}
    >
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
        <Defs>
          <SvgGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={from} />
            <Stop offset="100%" stopColor={to} />
          </SvgGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId})`} />
      </Svg>
      {children}
    </View>
  );
}

export function ScreenState({
  loading,
  loadingShimmer,
  error,
  empty,
  emptyMessage = "Nothing here yet",
  emptyIcon: EmptyIcon = Inbox,
  onRetry,
  children,
}: {
  loading?: boolean;
  loadingShimmer?: ReactNode;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  emptyIcon?: LucideIcon;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (loading) {
    if (loadingShimmer) {
      return <View className="flex-1">{loadingShimmer}</View>;
    }
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
