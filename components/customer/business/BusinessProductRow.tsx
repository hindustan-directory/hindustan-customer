import { memo } from "react";
import { Text, View } from "react-native";
import type { Product } from "../../../src/api/types";
import { accentFor } from "../accent";
import { AccentCard, AccentPill } from "../AccentCard";

type Props = {
  item: Product;
};

export const BusinessProductRow = memo(function BusinessProductRow({ item }: Props) {
  const accentKey = item.name;
  const accent = accentFor(accentKey);
  const priceLabel =
    item.price != null ? `₹${item.price}` : item.availability.replace(/_/g, " ");

  return (
    <AccentCard className="mb-3" bodyClassName="p-0">
      <View className="flex-row">
        <View className={`w-1.5 self-stretch ${accent.bar}`} />
        <View className="min-w-0 flex-1 flex-row items-start justify-between gap-3 p-4">
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
      </View>
    </AccentCard>
  );
});
