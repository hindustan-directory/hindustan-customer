import { router, useFocusEffect } from "expo-router";
import { Bell, Building2, Search, Tag } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { FlashList } from "@shopify/flash-list";
import {
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
import { ShimmerHome } from "../../components/Shimmer";
import { ScreenState } from "../../components/ui";
import type { VendorSearchResult } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";
import { useUnreadNotifications } from "../../src/hooks/useUnreadNotifications";
import { timeGreeting } from "../../src/lib/datetime";
import { floatingTabBarInset } from "../../src/navigation/chrome";
import { useHomeStore } from "../../src/stores/homeStore";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { count: unreadCount } = useUnreadNotifications();
  const [query, setQuery] = useState("");
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  // Module-level store: last-known data survives unmounts, so the screen paints
  // instantly and only shimmers on the very first load (see useFocusEffect).
  const categories = useHomeStore((s) => s.categories);
  const featured = useHomeStore((s) => s.featured);
  const loaded = useHomeStore((s) => s.loaded);
  const loading = useHomeStore((s) => s.loading);
  const refreshing = useHomeStore((s) => s.refreshing);
  const error = useHomeStore((s) => s.error);
  const load = useHomeStore((s) => s.load);
  const refresh = useHomeStore((s) => s.refresh);

  const categoryOptions = useMemo<SelectOption[]>(
    () =>
      categories.map((cat) => ({
        key: cat.slug,
        label: cat.name,
        accentKey: cat.slug,
      })),
    [categories],
  );

  // First visit blocks on load(); later focuses revalidate in the background.
  useFocusEffect(
    useCallback(() => {
      if (!loaded) void load();
      else void refresh();
    }, [loaded, load, refresh]),
  );

  const onPressBusiness = useCallback((slug: string) => {
    router.push(`/business/${slug}`);
  }, []);

  const renderFeatured = useCallback(
    ({ item }: { item: VendorSearchResult }) => (
      <BusinessCard item={item} onPress={onPressBusiness} />
    ),
    [onPressBusiness],
  );

  return (
    <View className="flex-1 bg-ink-50">
      <View className="bg-brand-600 px-5 pb-5" style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-sm text-brand-100">Hindustan Directory</Text>
            <Text className="mt-1 text-2xl font-bold text-white">
              {user
                ? `${timeGreeting()}, ${user.fullName.split(" ")[0]}`
                : "Find local businesses"}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/notifications")}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            className="ml-3 h-10 w-10 items-center justify-center rounded-full bg-white/15 active:bg-white/25"
          >
            <Bell size={22} color="#FFFFFF" strokeWidth={2} />
            {unreadCount > 0 ? (
              <View className="absolute -right-0.5 -top-0.5 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1">
                <Text className="text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
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
        loading={loading && featured.length === 0}
        loadingShimmer={<ShimmerHome />}
        error={featured.length === 0 ? error : null}
        onRetry={() => {
          void load();
        }}
      >
        <FlashList
          data={featured}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pt-4"
          contentContainerStyle={{ paddingBottom: floatingTabBarInset(insets.bottom) }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void refresh();
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
          renderItem={renderFeatured}
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
