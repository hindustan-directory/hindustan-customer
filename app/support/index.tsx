import { FlashList } from "@shopify/flash-list";
import { router, useFocusEffect } from "expo-router";
import { LifeBuoy, Plus } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl, Text, View } from "react-native";
import { AccentCard } from "../../components/customer/AccentCard";
import { ListPagination } from "../../components/customer/ListPagination";
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_TONE,
} from "../../components/customer/status";
import { Button, ScreenState } from "../../components/ui";
import { ShimmerList } from "../../components/Shimmer";
import { ApiError } from "../../src/api/client";
import { ticketsApi } from "../../src/api/endpoints";
import type { Ticket } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";
import { formatCreatedDate } from "../../src/lib/datetime";

const PAGE_SIZE = 10;

function TicketRow({ ticket }: { ticket: Ticket }) {
  return (
    <AccentCard
      className="mb-3"
      onPress={() => router.push(`/support/${ticket.id}` as never)}
    >
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-base font-semibold text-ink-900" numberOfLines={1}>
              {ticket.subject}
            </Text>
            <View
              className={`rounded-full border px-2 py-0.5 ${TICKET_STATUS_TONE[ticket.status]}`}
            >
              <Text className="text-[10px] font-bold">
                {TICKET_STATUS_LABELS[ticket.status]}
              </Text>
            </View>
          </View>
          <Text className="mt-1 text-xs text-ink-500" numberOfLines={2}>
            {ticket.description}
          </Text>
        </View>
        <View className="items-end gap-1">
          <Text className="text-[11px] font-semibold text-ink-400">
            #{ticket.ticketNo}
          </Text>
          <Text className="text-[11px] text-ink-400">
            {formatCreatedDate(ticket.createdAt)}
          </Text>
        </View>
      </View>
    </AccentCard>
  );
}

export default function SupportScreen() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<Ticket[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      const data = await ticketsApi.listMine({ page, pageSize: PAGE_SIZE });
      if (!mounted.current) return;
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof ApiError ? err.message : "Could not load tickets");
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [isAuthenticated, page]);

  // Refetch on focus so a ticket just raised in /support/new shows up as soon
  // as we pop back here (this screen stays mounted underneath the push).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!isAuthenticated) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-ink-50 px-6">
        <LifeBuoy size={40} color="#94A3B8" strokeWidth={1.75} />
        <Text className="text-center text-ink-600">Sign in to raise a support ticket</Text>
        <Button label="Sign in" onPress={() => router.push("/(auth)/login")} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink-50">
      <View className="border-b border-ink-100 bg-white px-5 pb-3 pt-1">
        <Button
          label="Raise a ticket"
          icon={Plus}
          onPress={() => router.push("/support/new" as never)}
        />
      </View>

      <ScreenState
        loading={loading}
        loadingShimmer={<ShimmerList className="px-5 py-4 pb-4" />}
        error={error}
        empty={!loading && !error && items.length === 0}
        emptyMessage="No support tickets yet — raise one to get help"
        emptyIcon={LifeBuoy}
        onRetry={() => {
          setLoading(true);
          void load();
        }}
      >
        <FlashList
          data={items}
          keyExtractor={(ticket) => ticket.id}
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
          renderItem={({ item }) => <TicketRow ticket={item} />}
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
