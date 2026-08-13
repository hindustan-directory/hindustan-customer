import { useEffect, type ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const INK_50 = "#F8FAFC";
const INK_100 = "#F1F5F9";
const INK_200 = "#E2E8F0";

function useShimmerStyle() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [progress]);

  return useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [INK_100, INK_200]),
  }));
}

export function ShimmerBox({ className = "", style, ...rest }: ViewProps & { className?: string }) {
  const shimmerStyle = useShimmerStyle();
  return (
    <Animated.View
      className={`overflow-hidden rounded-lg ${className}`}
      style={[shimmerStyle, style]}
      {...rest}
    />
  );
}

export function ShimmerLine({
  width = "100%",
  height = 14,
  className = "",
}: {
  width?: number | `${number}%`;
  height?: number;
  className?: string;
}) {
  const shimmerStyle = useShimmerStyle();
  return (
    <Animated.View className={`rounded-md ${className}`} style={[shimmerStyle, { width, height }]} />
  );
}

export function ShimmerCircle({ size = 40, className = "" }: { size?: number; className?: string }) {
  const shimmerStyle = useShimmerStyle();
  return (
    <Animated.View
      className={className}
      style={[shimmerStyle, { width: size, height: size, borderRadius: size / 2 }]}
    />
  );
}

function ShimmerPill({ width = 56 }: { width?: number }) {
  return <ShimmerBox className="h-5 rounded-full" style={{ width }} />;
}

function ShimmerAccentShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <View
      className={`mb-3 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm ${className}`}
    >
      <View className="p-4">{children}</View>
    </View>
  );
}

/** AccentCard rows — enquiries, reviews, bookings, sessions */
function ShimmerAccentRow() {
  return (
    <ShimmerAccentShell>
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <ShimmerLine width="55%" height={16} />
            <ShimmerPill width={52} />
          </View>
          <ShimmerLine width="88%" height={12} className="mt-2" />
          <ShimmerLine width="72%" height={12} className="mt-1.5" />
        </View>
        <View className="items-end gap-1">
          <ShimmerLine width={40} height={10} />
          <ShimmerBox className="h-4 w-4 rounded-sm" />
        </View>
      </View>
    </ShimmerAccentShell>
  );
}

function ShimmerBusinessCardRow() {
  return (
    <View className="mb-3 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
      <View className="flex-row gap-3 p-4">
        <ShimmerBox className="h-14 w-14 rounded-2xl" />
        <View className="min-w-0 flex-1 gap-2">
          <ShimmerLine width="75%" height={16} />
          <ShimmerBox className="h-6 w-28 rounded-full" />
          <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
            <ShimmerLine width="35%" height={12} />
            <ShimmerLine width="40%" height={12} />
          </View>
        </View>
      </View>
    </View>
  );
}

function ShimmerGenericRow() {
  return (
    <View className="mb-3 flex-row items-center gap-3 rounded-3xl border border-ink-100 bg-white px-4 py-3 shadow-sm">
      <ShimmerCircle size={36} />
      <View className="flex-1 gap-2">
        <ShimmerLine width="60%" />
        <ShimmerLine width="40%" height={12} />
      </View>
    </View>
  );
}

export type ShimmerListVariant = "accent" | "business" | "generic";

const LIST_ROW: Record<ShimmerListVariant, () => ReactNode> = {
  accent: ShimmerAccentRow,
  business: ShimmerBusinessCardRow,
  generic: ShimmerGenericRow,
};

export function ShimmerList({
  rows = 6,
  className = "",
  variant = "accent",
}: {
  rows?: number;
  className?: string;
  variant?: ShimmerListVariant;
}) {
  const Row = LIST_ROW[variant];
  return (
    <View className={className || "px-5 pb-8"}>
      {Array.from({ length: rows }, (_, i) => (
        <Row key={i} />
      ))}
    </View>
  );
}

export function ShimmerBusinessList({ rows = 5, className = "" }: { rows?: number; className?: string }) {
  return <ShimmerList rows={rows} className={className || "px-5 pb-8 pt-4"} variant="business" />;
}

export function ShimmerHome({ className = "" }: { className?: string }) {
  return (
    <View className={`bg-ink-50 px-5 pt-4 ${className}`}>
      <ShimmerBox className="mb-3 h-11 w-full rounded-2xl" />
      <ShimmerLine width="45%" height={20} className="mb-3" />
      {Array.from({ length: 5 }, (_, i) => (
        <ShimmerBusinessCardRow key={i} />
      ))}
    </View>
  );
}

export function ShimmerCard({
  lines = 4,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <View
      className={`rounded-3xl border border-ink-200/80 bg-white px-4 py-4 shadow-sm shadow-ink-900/5 ${className}`}
    >
      <ShimmerLine width="70%" height={20} className="mb-3" />
      {Array.from({ length: lines }, (_, i) => (
        <ShimmerLine key={i} width={`${Math.max(40, 80 - i * 12)}%`} height={12} className="mb-2" />
      ))}
    </View>
  );
}

export function ShimmerForm({ fields = 4, className = "" }: { fields?: number; className?: string }) {
  return (
    <View className={`px-5 py-4 ${className}`}>
      {Array.from({ length: fields }, (_, i) => (
        <View key={i} className="mb-4">
          <ShimmerLine width="30%" height={12} className="mb-2" />
          <ShimmerBox className="h-12 w-full rounded-xl" />
        </View>
      ))}
    </View>
  );
}

export function ShimmerDetail({ className = "" }: { className?: string }) {
  return (
    <View className={`bg-ink-50 px-5 py-4 pb-10 ${className}`}>
      <ShimmerLine width="60%" height={28} className="mb-2" />
      <ShimmerLine width="40%" height={14} className="mb-6" />
      <ShimmerCard lines={3} className="mb-4" />
      <ShimmerCard lines={4} className="mb-4" />
      <ShimmerCard lines={2} />
    </View>
  );
}

function ShimmerTabBar() {
  return (
    <View className="bg-ink-50 px-5 pb-2 pt-3">
      <View className="flex-row rounded-2xl bg-ink-100 p-1">
        {Array.from({ length: 3 }, (_, i) => (
          <View key={i} className="flex-1 items-center rounded-xl py-2.5">
            <ShimmerLine width={56} height={12} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function ShimmerBusinessDetail({ className = "" }: { className?: string }) {
  return (
    <View className={`flex-1 bg-ink-50 ${className}`}>
      <ShimmerBox className="h-36 w-full rounded-none" />
      <View className="bg-white px-5 pb-4 pt-9">
        <ShimmerLine width="72%" height={24} />
        <View className="mt-2 flex-row gap-2">
          <ShimmerBox className="h-6 w-24 rounded-full" />
          <ShimmerBox className="h-6 w-16 rounded-full" />
        </View>
        <View className="mt-3 flex-row gap-2">
          <ShimmerBox className="h-7 w-28 rounded-full" />
          <ShimmerBox className="h-7 w-20 rounded-full" />
        </View>
        <View className="mt-4 flex-row gap-2">
          <ShimmerBox className="h-11 flex-1 rounded-xl" />
          <ShimmerBox className="h-11 flex-1 rounded-xl" />
          <ShimmerBox className="h-11 flex-1 rounded-xl" />
        </View>
      </View>
      <ShimmerTabBar />
      <View className="px-5 pb-24 pt-4">
        <ShimmerCard lines={3} className="mb-4" />
        <ShimmerCard lines={4} />
      </View>
      <View className="absolute inset-x-0 bottom-0 border-t border-ink-100 bg-white px-5 py-3">
        <View className="flex-row gap-2">
          <ShimmerBox className="h-12 flex-1 rounded-xl" />
          <ShimmerBox className="h-12 flex-1 rounded-xl" />
          <ShimmerBox className="h-12 w-12 rounded-xl" />
        </View>
      </View>
    </View>
  );
}

export function ShimmerSlots({ rows = 4, className = "" }: { rows?: number; className?: string }) {
  return (
    <View className={`mt-4 gap-2 ${className}`}>
      {Array.from({ length: rows }, (_, i) => (
        <ShimmerBox key={i} className="h-14 w-full rounded-xl" />
      ))}
    </View>
  );
}

export function ShimmerScreen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <View className={`flex-1 bg-ink-50 ${className}`} style={{ backgroundColor: INK_50 }}>
      {children}
    </View>
  );
}
