import { router } from "expo-router";
import { Building2, Search, Tag } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  FilterSelectField,
  SelectSheet,
  type SelectOption,
} from "../../components/customer/FilterList";
import { BusinessCard } from "../../components/BusinessCard";
import { ScreenState } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { directoryApi, fetchCategories } from "../../src/api/endpoints";
import type { BusinessCategory, VendorSearchResult } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [featured, setFeatured] = useState<VendorSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  const categoryOptions = useMemo<SelectOption[]>(
    () =>
      categories.map((cat) => ({
        key: cat.slug,
        label: cat.name,
        accentKey: cat.slug,
      })),
    [categories],
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const [catsSettled, searchSettled] = await Promise.allSettled([
        fetchCategories(),
        directoryApi.search({ page: 1, pageSize: 10 }),
      ]);
      if (catsSettled.status === "fulfilled") {
        setCategories(catsSettled.value.filter((c) => c.isActive));
      } else {
        setCategories([]);
      }
      if (searchSettled.status === "fulfilled") {
        setFeatured(searchSettled.value.items);
      } else {
        const reason = searchSettled.reason;
        throw reason instanceof Error ? reason : new Error("Failed to load directory");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load home");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View className="flex-1 bg-ink-50" style={{ paddingTop: insets.top }}>
      <View className="bg-brand-600 px-5 pb-5 pt-3">
        <Text className="text-sm text-brand-100">Hindustan Directory</Text>
        <Text className="mt-1 text-2xl font-bold text-white">
          {user ? `Hi, ${user.fullName.split(" ")[0]}` : "Find local businesses"}
        </Text>
        <Pressable
          onPress={() => router.push("/(tabs)/search")}
          className="mt-4 flex-row items-center rounded-2xl bg-white px-4 py-3"
        >
          <Search size={18} color="#94A3B8" strokeWidth={2} style={{ marginRight: 8 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search businesses, services…"
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
            onSubmitEditing={() =>
              router.push({ pathname: "/(tabs)/search", params: { q: query.trim() } })
            }
            className="flex-1 text-base text-ink-900"
          />
        </Pressable>
      </View>

      <ScreenState
        loading={loading}
        error={error}
        onRetry={() => {
          setLoading(true);
          void load();
        }}
      >
        <FlatList
          data={featured}
          keyExtractor={(item) => item.id}
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
          ListHeaderComponent={
            <View className="mb-4">
              {categories.length > 0 ? (
                <View className="mb-3">
                  <FilterSelectField
                    compact
                    label="Category"
                    value="Choose…"
                    accentKey="home-category"
                    icon={Tag}
                    onPress={() => setCategorySheetOpen(true)}
                  />
                </View>
              ) : null}
              <Text className="mb-3 text-lg font-semibold text-ink-900">Featured nearby</Text>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center gap-2 py-10">
              <Building2 size={36} color="#94A3B8" strokeWidth={1.75} />
              <Text className="text-center text-ink-500">No businesses yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <BusinessCard
              item={item}
              onPress={() => router.push(`/business/${item.slug}`)}
            />
          )}
        />
      </ScreenState>

      <SelectSheet
        visible={categorySheetOpen}
        title="Browse by category"
        options={categoryOptions}
        selectedKey=""
        icon={Tag}
        onClose={() => setCategorySheetOpen(false)}
        onSelect={(slug) => {
          router.push({
            pathname: "/(tabs)/search",
            params: { category: slug },
          });
        }}
      />
    </View>
  );
}
