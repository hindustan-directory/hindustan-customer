import { Image } from "expo-image";
import { Building2, MapPin, Star } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import type { VendorSearchResult } from "../src/api/types";

export function formatRating(avgRating: string) {
  const n = Number(avgRating);
  return Number.isFinite(n) ? n.toFixed(1) : "—";
}

export function BusinessCard({
  item,
  onPress,
}: {
  item: VendorSearchResult;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row overflow-hidden rounded-2xl border border-ink-100 bg-white active:bg-ink-50"
    >
      <View className="h-24 w-24 bg-brand-50">
        {item.photoUrl ? (
          <Image
            source={{ uri: item.photoUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Building2 size={28} color="#2563EB" strokeWidth={1.75} />
          </View>
        )}
      </View>
      <View className="flex-1 justify-center px-3 py-2">
        <Text className="text-base font-semibold text-ink-900" numberOfLines={1}>
          {item.businessName}
        </Text>
        <View className="mt-0.5 flex-row items-center gap-1">
          <Text className="shrink text-xs text-ink-500" numberOfLines={1}>
            {item.categoryName}
          </Text>
          {item.city ? (
            <>
              <Text className="text-xs text-ink-400">·</Text>
              <MapPin size={11} color="#94A3B8" strokeWidth={2} />
              <Text className="shrink text-xs text-ink-500" numberOfLines={1}>
                {item.city}
              </Text>
            </>
          ) : null}
        </View>
        <View className="mt-1 flex-row items-center gap-1">
          <Star size={14} color="#1D4ED8" fill="#1D4ED8" strokeWidth={0} />
          <Text className="text-sm text-brand-700">
            {formatRating(item.avgRating)} ({item.reviewCount})
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
