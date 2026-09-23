import { router, useFocusEffect } from "expo-router";
import { Heart } from "lucide-react-native";
import { useCallback } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SavedBusinessCard } from "../../components/customer/SavedBusinessCard";
import { ListPagination } from "../../components/customer/ListPagination";
import { ShimmerBusinessList } from "../../components/Shimmer";
import { Button, ScreenState } from "../../components/ui";
import type { FavouriteRow } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";
import { floatingTabBarInset } from "../../src/navigation/chrome";
import { useFavouritesStore } from "../../src/stores/favouritesStore";

export default function FavouritesScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const items = useFavouritesStore((s) => s.items);
  const page = useFavouritesStore((s) => s.page);
  const totalPages = useFavouritesStore((s) => s.totalPages);
  const total = useFavouritesStore((s) => s.total);
  const loaded = useFavouritesStore((s) => s.loaded);
  const loading = useFavouritesStore((s) => s.loading);
  const refreshing = useFavouritesStore((s) => s.refreshing);
  const error = useFavouritesStore((s) => s.error);
  const removingId = useFavouritesStore((s) => s.removingId);
  const load = useFavouritesStore((s) => s.load);
  const refresh = useFavouritesStore((s) => s.refresh);
  const setPage = useFavouritesStore((s) => s.setPage);
  const removeFavourite = useFavouritesStore((s) => s.removeFavourite);

  // Module-level store persists across mounts: show cached favourites instantly
  // on focus, then revalidate in the background (SWR) instead of blocking.
  useFocusEffect(
    useCallback(() => {
      if (!loaded) void load(isAuthenticated);
      else void refresh(isAuthenticated);
    }, [loaded, load, refresh, isAuthenticated]),
  );

  const keyExtractor = useCallback((item: FavouriteRow) => item.vendor.id, []);

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
        loading={loading && items.length === 0}
        loadingShimmer={<ShimmerBusinessList />}
        error={error}
        empty={!loading && !error && items.length === 0}
        emptyMessage="No favourites yet — heart a business to save it"
        emptyIcon={Heart}
        onRetry={() => void load(isAuthenticated)}
      >
        <FlatList
          data={items}
          keyExtractor={keyExtractor}
          contentContainerClassName="px-5 pt-4"
          contentContainerStyle={{ paddingBottom: floatingTabBarInset(insets.bottom) }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh(isAuthenticated)}
              tintColor="#2563EB"
            />
          }
          renderItem={({ item }) => (
            <SavedBusinessCard
              item={item}
              removing={removingId === item.vendor.id}
              onRemove={() => void removeFavourite(item.vendor.id, isAuthenticated)}
            />
          )}
        />
        <ListPagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={(next) => void setPage(next, isAuthenticated)}
        />
      </ScreenState>
    </View>
  );
}
