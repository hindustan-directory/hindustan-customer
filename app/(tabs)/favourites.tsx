import { router } from "expo-router";
import { Heart, Star } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatRating } from "../../components/BusinessCard";
import { Button, ScreenState } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { customerApi } from "../../src/api/endpoints";
import type { FavouriteRow } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";

export default function FavouritesScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<FavouriteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await customerApi.favourites(1, 50);
      setItems(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load favourites");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isAuthenticated) {
    return (
      <View
        className="flex-1 items-center justify-center bg-ink-50 px-6"
        style={{ paddingTop: insets.top }}
      >
        <Heart size={40} color="#94A3B8" strokeWidth={1.75} />
        <Text className="mt-4 mb-2 text-xl font-semibold text-ink-900">Saved businesses</Text>
        <Text className="mb-6 text-center text-ink-500">Sign in to sync your favourites</Text>
        <Button label="Sign in" onPress={() => router.push("/(auth)/login")} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink-50" style={{ paddingTop: insets.top }}>
      <Text className="px-5 pb-2 pt-3 text-2xl font-bold text-ink-900">Saved</Text>
      <ScreenState
        loading={loading}
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
          contentContainerClassName="px-5 pb-8"
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
            <View className="mb-3 rounded-2xl border border-ink-100 bg-white px-4 py-3">
              <Pressable
                onPress={() => router.push(`/business/${item.vendor.slug}`)}
                className="active:opacity-80"
              >
                <Text className="text-base font-semibold text-ink-900">{item.vendor.businessName}</Text>
                <Text className="mt-0.5 text-xs text-ink-500">
                  {item.vendor.categoryName}
                  {item.vendor.city ? ` · ${item.vendor.city}` : ""}
                </Text>
                <View className="mt-1 flex-row items-center gap-1">
                  <Star size={14} color="#1D4ED8" fill="#1D4ED8" strokeWidth={0} />
                  <Text className="text-sm text-brand-700">
                    {formatRating(item.vendor.avgRating)}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                className="mt-3 self-start py-1"
                onPress={() => {
                  void customerApi
                    .removeFavourite(item.vendor.id)
                    .then(() => load())
                    .catch((err) => {
                      setError(err instanceof ApiError ? err.message : "Could not remove");
                    });
                }}
              >
                <Text className="text-sm font-medium text-red-600">Remove</Text>
              </Pressable>
            </View>
          )}
        />
      </ScreenState>
    </View>
  );
}
