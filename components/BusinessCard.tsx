import { Image } from "expo-image";
import { MapPin, Star } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import type { VendorSearchResult } from "../src/api/types";
import { accentFor } from "./customer/accent";
import { AccentAvatar, AccentPill } from "./customer/AccentCard";

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
  const accentKey = item.categoryName || item.slug;
  const accent = accentFor(accentKey);

  return (
    <Pressable onPress={onPress} className="mb-3 active:opacity-95">
      <View className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
        <View className="flex-row gap-3 p-4">
          {item.photoUrl ? (
            <View className="h-14 w-14 overflow-hidden rounded-2xl border border-ink-100 bg-brand-50">
              <Image
                source={{ uri: item.photoUrl }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            </View>
          ) : (
            <AccentAvatar accentKey={accentKey} label={item.businessName} />
          )}

          <View className="min-w-0 flex-1 justify-center">
            <Text className="text-base font-bold text-ink-900" numberOfLines={2}>
              {item.businessName}
            </Text>

            <View className="mt-2">
              <AccentPill accentKey={accentKey} label={item.categoryName} />
            </View>

            <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1">
              {item.city ? (
                <View className="flex-row items-center gap-1">
                  <MapPin size={12} color={accent.icon} strokeWidth={2.25} />
                  <Text className="text-xs font-medium text-ink-600">{item.city}</Text>
                </View>
              ) : null}
              <View className="flex-row items-center gap-1">
                <Star size={13} color="#F59E0B" fill="#F59E0B" strokeWidth={0} />
                <Text className="text-xs font-semibold text-ink-700">
                  {formatRating(item.avgRating)} ({item.reviewCount})
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
