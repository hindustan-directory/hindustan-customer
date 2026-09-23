import { Image } from "expo-image";
import { router } from "expo-router";
import { memo } from "react";
import { Text, View } from "react-native";
import type { Product } from "../../../src/api/types";
import { AccentCard, AccentPill } from "../AccentCard";

type Props = {
  item: Product;
  /** Vendor slug + name, passed through so the product detail page can deep-link back. */
  slug?: string;
  businessName?: string;
};

export const BusinessProductRow = memo(function BusinessProductRow({
  item,
  slug,
  businessName,
}: Props) {
  const accentKey = item.name;
  const photoUrl = item.images?.[0]?.imageUrl;
  const priceLabel =
    item.price != null ? `₹${item.price}` : item.availability.replace(/_/g, " ");

  return (
    <AccentCard
      className="mb-3"
      onPress={() =>
        router.push({
          pathname: "/product/[id]",
          params: { id: item.id, slug, name: item.name, businessName },
        })
      }
    >
      <View className="flex-row items-start gap-3">
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            className="h-16 w-16 rounded-2xl bg-ink-100"
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
            recyclingKey={item.id}
          />
        ) : null}
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-ink-900">{item.name}</Text>
          {item.description ? (
            <Text className="mt-1 text-sm leading-5 text-ink-500" numberOfLines={3}>
              {item.description}
            </Text>
          ) : null}
          {item.availability && item.price != null ? (
            <View className="mt-2">
              <AccentPill accentKey={accentKey} label={item.availability.replace(/_/g, " ")} />
            </View>
          ) : null}
        </View>
        <Text className="text-sm font-bold text-ink-900">{priceLabel}</Text>
      </View>
    </AccentCard>
  );
});
