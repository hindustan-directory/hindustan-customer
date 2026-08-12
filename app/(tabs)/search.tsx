import { router, useLocalSearchParams } from "expo-router";
import { Search, Star, Tag, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BusinessCard } from "../../components/BusinessCard";
import {
  FilterSelectField,
  SelectSheet,
  type SelectOption,
} from "../../components/customer/FilterList";
import { ListPagination } from "../../components/customer/ListPagination";
import { Button, ScreenState } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { directoryApi, fetchCategories } from "../../src/api/endpoints";
import type { BusinessCategory, VendorSearchResult } from "../../src/api/types";

const PAGE_SIZE = 10;

const RATING_OPTIONS: SelectOption[] = [
  { key: "", label: "Any rating", accentKey: "rating-any" },
  { key: "3", label: "3.0★ and above", accentKey: "rating-3" },
  { key: "4", label: "4.0★ and above", accentKey: "rating-4" },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; category?: string; city?: string; rating?: string }>();
  const [q, setQ] = useState(params.q ?? "");
  const [city, setCity] = useState(params.city ?? "");
  const [category, setCategory] = useState(params.category ?? "");
  const [rating, setRating] = useState<number | undefined>(
    params.rating ? Number(params.rating) : undefined,
  );
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [items, setItems] = useState<VendorSearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingSheetOpen, setRatingSheetOpen] = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  useEffect(() => {
    void fetchCategories()
      .then((data) => setCategories(data.filter((cat) => cat.isActive)))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setQ(params.q ?? "");
    setCategory(params.category ?? "");
    setCity(params.city ?? "");
    setRating(params.rating ? Number(params.rating) : undefined);
    setPage(1);
  }, [params.q, params.category, params.city, params.rating]);

  const categoryOptions = useMemo<SelectOption[]>(
    () => [
      { key: "", label: "All categories", accentKey: "all-categories" },
      ...categories.map((cat) => ({
        key: cat.slug,
        label: cat.name,
        accentKey: cat.slug,
      })),
    ],
    [categories],
  );

  const categoryLabel = useMemo(
    () => categoryOptions.find((opt) => opt.key === category)?.label ?? "All",
    [categoryOptions, category],
  );

  const ratingLabel = useMemo(() => {
    const key = rating != null ? String(rating) : "";
    if (key === "3") return "3.0★+";
    if (key === "4") return "4.0★+";
    return "Any";
  }, [rating]);

  const executeSearch = useCallback(
    async (searchPage: number) => {
      setError(null);
      setLoading(true);
      try {
        const data = await directoryApi.search({
          q: q.trim() || undefined,
          category: category || undefined,
          city: city.trim() || undefined,
          rating,
          page: searchPage,
          pageSize: PAGE_SIZE,
        });
        setItems(data.items);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setPage(searchPage);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Search failed");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [q, category, city, rating],
  );

  useEffect(() => {
    void executeSearch(1);
  }, [params.q, params.category, params.city, params.rating]); // eslint-disable-line react-hooks/exhaustive-deps

  function runSearch(nextPage = 1) {
    void executeSearch(nextPage);
  }

  function selectCategory(slug: string) {
    setCategory(slug);
    runSearch(1);
  }

  function selectRating(key: string) {
    setRating(key ? Number(key) : undefined);
    runSearch(1);
  }

  const activeFilters = (category ? 1 : 0) + (city.trim() ? 1 : 0) + (rating ? 1 : 0);

  return (
    <View className="flex-1 bg-ink-50" style={{ paddingTop: insets.top }}>
      <View className="border-b border-ink-100 bg-white px-4 pb-2.5 pt-2">
        <Text className="mb-1.5 text-xl font-bold text-ink-900">Search</Text>
        <View className="flex-row items-center rounded-lg border border-ink-200 bg-ink-50 px-2.5">
          <Search size={16} color="#94A3B8" strokeWidth={2} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by name or keyword"
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
            onSubmitEditing={() => runSearch(1)}
            className="flex-1 px-2 py-2 text-sm text-ink-900"
          />
        </View>

        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="City (e.g. Mumbai)"
          placeholderTextColor="#94A3B8"
          returnKeyType="search"
          onSubmitEditing={() => runSearch(1)}
          className="mt-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900"
        />

        <View className="mt-2 flex-row gap-2">
          <View className="flex-1">
            <FilterSelectField
              compact
              label="Rating"
              value={ratingLabel}
              accentKey="rating-filter"
              icon={Star}
              onPress={() => setRatingSheetOpen(true)}
            />
          </View>
          {categories.length > 0 ? (
            <View className="flex-1">
              <FilterSelectField
                compact
                label="Category"
                value={categoryLabel}
                accentKey={category || "category-filter"}
                icon={Tag}
                onPress={() => setCategorySheetOpen(true)}
              />
            </View>
          ) : null}
        </View>

        <View className="mt-2 flex-row items-center justify-between gap-2">
          <Text className="text-xs text-ink-500">
            {loading ? "Searching…" : `${total} result${total === 1 ? "" : "s"}`}
          </Text>
          <View className="flex-row gap-2">
            {activeFilters > 0 ? (
              <Pressable
                onPress={() => {
                  setCategory("");
                  setCity("");
                  setRating(undefined);
                  runSearch(1);
                }}
                className="flex-row items-center gap-1 rounded-xl border border-ink-200 bg-white px-3 py-2 active:bg-ink-50"
              >
                <X size={14} color="#64748B" strokeWidth={2} />
                <Text className="text-xs font-semibold text-ink-600">Clear filters</Text>
              </Pressable>
            ) : null}
            <Button label="Search" className="px-4 py-2" onPress={() => runSearch(1)} />
          </View>
        </View>
      </View>

      <SelectSheet
        visible={ratingSheetOpen}
        title="Minimum rating"
        options={RATING_OPTIONS}
        selectedKey={rating != null ? String(rating) : ""}
        icon={Star}
        onClose={() => setRatingSheetOpen(false)}
        onSelect={selectRating}
      />

      <SelectSheet
        visible={categorySheetOpen}
        title="Category"
        options={categoryOptions}
        selectedKey={category}
        icon={Tag}
        onClose={() => setCategorySheetOpen(false)}
        onSelect={selectCategory}
      />

      <ScreenState
        loading={loading}
        error={error}
        empty={!loading && !error && items.length === 0}
        emptyMessage="No matches — try another search or filter"
        emptyIcon={Search}
        onRetry={() => void executeSearch(page)}
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
                void executeSearch(page);
              }}
            />
          }
          renderItem={({ item }) => (
            <BusinessCard item={item} onPress={() => router.push(`/business/${item.slug}`)} />
          )}
        />
        <ListPagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={(next) => void executeSearch(next)}
        />
      </ScreenState>
    </View>
  );
}
