import { router, useLocalSearchParams } from "expo-router";
import { Search } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BusinessCard } from "../../components/BusinessCard";
import { ScreenState } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { directoryApi } from "../../src/api/endpoints";
import type { VendorSearchResult } from "../../src/api/types";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; category?: string; city?: string }>();
  const [q, setQ] = useState(params.q ?? "");
  const [items, setItems] = useState<VendorSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (searchQ = q) => {
    setError(null);
    try {
      const data = await directoryApi.search({
        q: searchQ.trim() || undefined,
        category: params.category || undefined,
        city: params.city || undefined,
        page: 1,
        pageSize: 30,
      });
      setItems(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Search failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [q, params.category, params.city]);

  useEffect(() => {
    setQ(params.q ?? "");
    setLoading(true);
    void load(params.q ?? "");
  }, [params.q, params.category, params.city]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View className="flex-1 bg-ink-50" style={{ paddingTop: insets.top }}>
      <View className="border-b border-ink-100 bg-white px-5 pb-3 pt-3">
        <Text className="mb-2 text-2xl font-bold text-ink-900">Search</Text>
        <View className="flex-row items-center rounded-xl border border-ink-200 bg-ink-50 px-3">
          <Search size={18} color="#94A3B8" strokeWidth={2} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by name or keyword"
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
            onSubmitEditing={() => {
              setLoading(true);
              void load(q);
            }}
            className="flex-1 px-2 py-3 text-base text-ink-900"
          />
        </View>
        {params.category ? (
          <Text className="mt-2 text-xs text-brand-700">Category: {params.category}</Text>
        ) : null}
      </View>

      <ScreenState
        loading={loading}
        error={error}
        empty={!loading && !error && items.length === 0}
        emptyMessage="No matches — try another search"
        emptyIcon={Search}
        onRetry={() => {
          setLoading(true);
          void load();
        }}
      >
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 py-4 pb-8"
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
            <BusinessCard item={item} onPress={() => router.push(`/business/${item.slug}`)} />
          )}
        />
      </ScreenState>
    </View>
  );
}
