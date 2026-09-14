import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Bell, CheckCheck } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import { AccentCard } from "../components/customer/AccentCard";
import { ListPagination } from "../components/customer/ListPagination";
import { Button, ScreenState } from "../components/ui";
import { ShimmerList } from "../components/Shimmer";
import { ApiError } from "../src/api/client";
import { notificationsApi } from "../src/api/endpoints";
import type { AppNotification } from "../src/api/types";
import { useAuth } from "../src/auth/AuthProvider";
import { formatRelativeTime } from "../src/lib/datetime";

const PAGE_SIZE = 10;

function NotificationRow({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: () => void;
}) {
  const unread = !item.isRead;

  return (
    <AccentCard className="mb-3" onPress={onPress}>
      <View className="flex-row items-start gap-3">
        {unread ? (
          <View className="mt-1.5 h-2.5 w-2.5 rounded-full bg-brand-600" />
        ) : (
          <View className="mt-1.5 h-2.5 w-2.5 rounded-full bg-transparent" />
        )}
        <View className="min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className={`min-w-0 flex-1 text-base ${
                unread ? "font-bold text-ink-900" : "font-semibold text-ink-700"
              }`}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <Text className="text-[11px] text-ink-400">
              {formatRelativeTime(item.createdAt)}
            </Text>
          </View>
          {item.body ? (
            <Text className="mt-1 text-sm text-ink-500" numberOfLines={3}>
              {item.body}
            </Text>
          ) : null}
        </View>
      </View>
    </AccentCard>
  );
}

export default function NotificationsScreen() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards post-await setState so a slow response can't update after unmount.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [data, unread] = await Promise.all([
        notificationsApi.list({ page, pageSize: PAGE_SIZE }),
        notificationsApi.unreadCount(),
      ]);
      if (!mounted.current) return;
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setUnreadCount(unread.count);
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof ApiError ? err.message : "Could not load notifications");
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [isAuthenticated, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(item: AppNotification) {
    if (item.isRead) return;
    // optimistic — the row is idempotent server-side
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await notificationsApi.markRead(item.id);
    } catch {
      if (!mounted.current) return;
      // revert on failure
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: false } : n)),
      );
      setUnreadCount((c) => c + 1);
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead();
      if (!mounted.current) return;
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof ApiError ? err.message : "Could not mark all read");
    } finally {
      if (mounted.current) setMarkingAll(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-ink-50 px-6">
        <Bell size={40} color="#94A3B8" strokeWidth={1.75} />
        <Text className="text-center text-ink-600">Sign in to view notifications</Text>
        <Button label="Sign in" onPress={() => router.push("/(auth)/login")} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink-50">
      {unreadCount > 0 ? (
        <View className="flex-row items-center justify-between border-b border-ink-100 bg-white px-5 py-3">
          <Text className="text-sm text-ink-500">
            {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={markingAll}
            onPress={() => void markAllRead()}
            className={`flex-row items-center gap-1.5 rounded-lg px-2 py-1 ${
              markingAll ? "opacity-50" : "active:bg-ink-50"
            }`}
          >
            <CheckCheck size={16} color="#2563EB" strokeWidth={2.25} />
            <Text className="text-sm font-semibold text-brand-600">Mark all read</Text>
          </Pressable>
        </View>
      ) : null}

      <ScreenState
        loading={loading}
        loadingShimmer={<ShimmerList className="px-5 py-4 pb-4" />}
        error={error}
        empty={!loading && !error && items.length === 0}
        emptyMessage="No notifications yet"
        emptyIcon={Bell}
        onRetry={() => {
          setLoading(true);
          void load();
        }}
      >
        <FlashList
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
              tintColor="#2563EB"
            />
          }
          renderItem={({ item }) => (
            <NotificationRow item={item} onPress={() => void markRead(item)} />
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
