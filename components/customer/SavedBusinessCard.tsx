import { router } from "expo-router";
import { MapPin, Star, Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { formatRating } from "../BusinessCard";
import type { FavouriteRow } from "../../src/api/types";
import { accentFor } from "./accent";
import { AccentAvatar, AccentCard, AccentPill } from "./AccentCard";

type Props = {
  item: FavouriteRow;
  onRemove: () => void;
  removing?: boolean;
};

export function SavedBusinessCard({ item, onRemove, removing }: Props) {
  const { vendor } = item;
  const accentKey = vendor.categoryName || vendor.slug;
  const accent = accentFor(accentKey);

  return (
    <AccentCard
      className="mb-4"
      bodyClassName="p-0"
      footer={
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.push(`/business/${vendor.slug}`)}
            className="rounded-xl bg-brand-600 px-4 py-2 active:bg-brand-700"
          >
            <Text className="text-xs font-bold text-white">View business</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${vendor.businessName} from saved`}
            disabled={removing}
            onPress={onRemove}
            className="flex-row items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-2 active:bg-ink-100"
          >
            <Trash2 size={14} color="#64748B" strokeWidth={2} />
            <Text className="text-xs font-semibold text-ink-600">
              {removing ? "Removing…" : "Remove"}
            </Text>
          </Pressable>
        </View>
      }
    >
      <View className="flex-row gap-3 p-4">
        <AccentAvatar accentKey={accentKey} label={vendor.businessName} />

        <Pressable
          className="min-w-0 flex-1 active:opacity-80"
          onPress={() => router.push(`/business/${vendor.slug}`)}
        >
          <Text className="text-base font-bold text-ink-900" numberOfLines={2}>
            {vendor.businessName}
          </Text>

          <View className="mt-2">
            <AccentPill accentKey={accentKey} label={vendor.categoryName} />
          </View>

          <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1">
            {vendor.city ? (
              <View className="flex-row items-center gap-1">
                <MapPin size={12} color={accent.icon} strokeWidth={2.25} />
                <Text className="text-xs font-medium text-ink-600">{vendor.city}</Text>
              </View>
            ) : null}
            <View className="flex-row items-center gap-1">
              <Star size={13} color="#F59E0B" fill="#F59E0B" strokeWidth={0} />
              <Text className="text-xs font-semibold text-ink-700">
                {formatRating(vendor.avgRating)}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
    </AccentCard>
  );
}
