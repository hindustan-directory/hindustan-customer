import { router } from "expo-router";
import { Heart } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SavedBusinessCard } from "../../components/customer/SavedBusinessCard";
import { ListPagination } from "../../components/customer/ListPagination";
import { ShimmerBusinessList } from "../../components/Shimmer";
import { Button, ScreenState } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { customerApi } from "../../src/api/endpoints";
import type { FavouriteRow } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";

export default function FavouritesScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<FavouriteRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await customerApi.favourites(page, 10);
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load favourites");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeFavourite(vendorId: string) {
    setRemovingId(vendorId);
    setError(null);
    try {
      await customerApi.removeFavourite(vendorId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove");
    } finally {
      setRemovingId(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <View
        className="flex-1 items-center justify-center bg-ink-50 px-6"
        style={{ paddingTop: insets.top }}
      >
        <View className="mb-4 rounded-full bg-brand-100 p-5">
          <Heart size={40} color="#2563EB" fill="#2563EB" strokeWidth={0} />
        </View>
        <Text className="mb-2 text-xl font-bold text-ink-900">Saved businesses</Text>
        <Text className="mb-6 text-center text-ink-500">Sign in to sync your favourites</Text>
        <Button label="Sign in" onPress={() => router.push("/(auth)/login")} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink-50" style={{ paddingTop: insets.top }}>
      <View className="border-b border-ink-100 bg-white px-5 pb-4 pt-3">
        <View className="flex-row items-center gap-2">
          <View className="rounded-full bg-brand-100 p-2">
            <Heart size={18} color="#2563EB" fill="#2563EB" strokeWidth={0} />
          </View>
          <View>
            <Text className="text-2xl font-bold text-ink-900">Saved</Text>
            {!loading && !error ? (
              <Text className="text-sm text-ink-500">
                {total} favourite{total === 1 ? "" : "s"} you love
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <ScreenState
        loading={loading}
        loadingShimmer={<ShimmerBusinessList />}
        error={error}
        empty={!loading && !error && items.length === 0}
        emptyMessage="No favourites yet — heart a business to save it"
        emptyIcon={Heart}
        onRetry={() => {
          setLoading(true);
          void load();
        }}
      >
        <FlatList
          data={items}
          keyExtractor={(item) => item.vendor.id}
          contentContainerClassName="px-5 pb-8 pt-4"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor="#2563EB"
            />
          }
          renderItem={({ item }) => (
            <SavedBusinessCard
              item={item}
              removing={removingId === item.vendor.id}
              onRemove={() => void removeFavourite(item.vendor.id)}
            />
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
    </View>
  );
}
