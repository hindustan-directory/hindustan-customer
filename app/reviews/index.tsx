import { Star } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { ScreenState } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { customerApi } from "../../src/api/endpoints";
import type { CustomerReview } from "../../src/api/types";

export default function MyReviewsScreen() {
  const [items, setItems] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await customerApi.listReviews(1, 50);
      setItems(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load reviews");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <Stack.Screen options={{ title: "My reviews" }} />
      <View className="flex-1 bg-ink-50">
        <ScreenState
          loading={loading}
          error={error}
          empty={!loading && !error && items.length === 0}
          emptyMessage="You have not written any reviews yet"
          emptyIcon={Star}
          onRetry={() => {
            setLoading(true);
            void load();
          }}
        >
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-5 py-4 pb-10"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  void load();
                }}
              />
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  if (item.vendor?.slug) {
                    router.push(`/business/${item.vendor.slug}` as never);
                  }
                }}
                className="mb-3 rounded-2xl border border-ink-100 bg-white px-4 py-3 active:bg-ink-50"
              >
                <Text className="font-semibold text-ink-900">
                  {item.vendor?.businessName ?? "Business"}
                </Text>
                <Text className="mt-1 text-sm text-brand-700">
                  {"★".repeat(item.rating)}
                  {"☆".repeat(Math.max(0, 5 - item.rating))}
                </Text>
                {item.comment ? (
                  <Text className="mt-2 text-sm text-ink-700">{item.comment}</Text>
                ) : null}
                {item.isHidden ? (
                  <Text className="mt-1 text-xs text-ink-400">Hidden by moderation</Text>
                ) : null}
                <Text className="mt-1 text-xs text-ink-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </Pressable>
            )}
          />
        </ScreenState>
      </View>
    </>
  );
}
