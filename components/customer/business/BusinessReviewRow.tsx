import { Star } from "lucide-react-native";
import { memo } from "react";
import { Text, View } from "react-native";
import type { PublicReview } from "../../../src/api/types";
import { formatCreatedDate } from "../../../src/lib/datetime";
import { AccentCard } from "../AccentCard";

type Props = {
  item: PublicReview;
};

export const BusinessReviewRow = memo(function BusinessReviewRow({ item }: Props) {
  return (
    <AccentCard className="mb-3">
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold text-ink-900">{item.customerName}</Text>
          <View className="mt-1 flex-row items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={13}
                color={i < item.rating ? "#F59E0B" : "#E2E8F0"}
                fill={i < item.rating ? "#F59E0B" : "transparent"}
                strokeWidth={0}
              />
            ))}
          </View>
        </View>
        {item.createdAt ? (
          <Text className="text-[11px] text-ink-400">{formatCreatedDate(item.createdAt)}</Text>
        ) : null}
      </View>
      {item.comment ? (
        <Text className="mt-2 text-sm leading-5 text-ink-600">{item.comment}</Text>
      ) : null}
    </AccentCard>
  );
});
