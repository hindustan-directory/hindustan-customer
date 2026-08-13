import { router } from "expo-router";
import { Pencil, Star } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { AccentCard } from "../../components/customer/AccentCard";
import { ListPagination } from "../../components/customer/ListPagination";
import { ReviewEditModal } from "../../components/customer/ReviewEditModal";
import { Button, IconActionButton, ScreenState } from "../../components/ui";
import { ShimmerList } from "../../components/Shimmer";
import { ApiError } from "../../src/api/client";
import { customerApi } from "../../src/api/endpoints";
import type { CustomerReview } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";
import { formatCreatedDate } from "../../src/lib/datetime";

const PAGE_SIZE = 10;

function StarRow({ rating }: { rating: number }) {
  return (
    <Text className="text-sm text-amber-500">
      {"★".repeat(rating)}
      {"☆".repeat(Math.max(0, 5 - rating))}
    </Text>
  );
}

export default function MyReviewsScreen() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CustomerReview[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CustomerReview | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await customerApi.listReviews(page, PAGE_SIZE);
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load reviews");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, page]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isAuthenticated) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <Star size={40} color="#94A3B8" strokeWidth={1.75} />
        <Text className="text-center text-ink-600">Sign in to view your reviews</Text>
        <Button label="Sign in" onPress={() => router.push("/(auth)/login")} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink-50">
      <ScreenState
        loading={loading}
        loadingShimmer={<ShimmerList className="px-5 py-4 pb-4" />}
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
          contentContainerClassName="px-5 py-4 pb-4"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
            />
          }
          ListHeaderComponent={
            total > 0 ? (
              <Text className="mb-3 text-sm text-ink-500">
                {total} review{total === 1 ? "" : "s"} — tap edit to update any of them
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
              <AccentCard className="mb-3">
                <View className="flex-row items-start justify-between gap-2">
                  <Pressable
                    className="min-w-0 flex-1 active:opacity-80"
                    onPress={() => {
                      if (item.vendor?.slug) {
                        router.push(`/business/${item.vendor.slug}` as never);
                      }
                    }}
                  >
                    <Text className="font-semibold text-ink-900">
                      {item.vendor?.businessName ?? "Business"}
                    </Text>
                    <View className="mt-1">
                      <StarRow rating={item.rating} />
                    </View>
                  </Pressable>
                  <IconActionButton
                    icon={Pencil}
                    accessibilityLabel="Edit review"
                    onPress={() => setEditing(item)}
                  />
                </View>
                {item.comment ? (
                  <Text className="mt-2 text-sm text-ink-700">{item.comment}</Text>
                ) : null}
                {item.isHidden ? (
                  <Text className="mt-1 text-xs text-ink-400">Hidden by moderation</Text>
                ) : null}
                <Text className="mt-1 text-xs text-ink-400">
                  {formatCreatedDate(item.createdAt)}
                </Text>
              </AccentCard>
          )}
        />
        <ListPagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={(next) => {
            setLoading(true);
            setPage(next);
          }}
        />
      </ScreenState>

      {editing ? (
        <ReviewEditModal
          visible
          vendorId={editing.vendorId}
          businessName={editing.vendor?.businessName}
          existingReview={editing}
          onClose={() => setEditing(null)}
          onSaved={() => void load()}
        />
      ) : null}
    </View>
  );
}
