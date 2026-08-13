import { router } from "expo-router";
import { ChevronDown, MessageSquare } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { AccentCard } from "../../components/customer/AccentCard";
import { ListPagination } from "../../components/customer/ListPagination";
import {
  ENQUIRY_STATUS_LABELS,
  ENQUIRY_STATUS_TONE,
} from "../../components/customer/status";
import { Button, ScreenState } from "../../components/ui";
import { ShimmerList } from "../../components/Shimmer";
import { ApiError } from "../../src/api/client";
import { customerApi } from "../../src/api/endpoints";
import type { Enquiry, EnquiryStatus } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";
import { formatCreatedDate } from "../../src/lib/datetime";

const PAGE_SIZE = 10;

function EnquiryRow({ enquiry }: { enquiry: Enquiry }) {
  const [expanded, setExpanded] = useState(false);
  const message = enquiry.message?.trim() ?? "";
  const status = enquiry.status as EnquiryStatus;

  return (
    <AccentCard className="mb-3" onPress={() => setExpanded((prev) => !prev)}>
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            {enquiry.vendor?.slug ? (
              <Pressable onPress={() => router.push(`/business/${enquiry.vendor!.slug}`)}>
                <Text className="text-base font-semibold text-brand-700">
                  {enquiry.vendor.businessName}
                </Text>
              </Pressable>
            ) : (
              <Text className="text-base font-semibold text-ink-900">{enquiry.name}</Text>
            )}
            <View className={`rounded-full border px-2 py-0.5 ${ENQUIRY_STATUS_TONE[status]}`}>
              <Text className="text-[10px] font-bold">{ENQUIRY_STATUS_LABELS[status]}</Text>
            </View>
          </View>
          <Text className="mt-1 text-xs text-ink-500" numberOfLines={expanded ? undefined : 2}>
            {message || "No message included"}
          </Text>
        </View>
        <View className="items-end gap-1">
          <Text className="text-[11px] text-ink-400">{formatCreatedDate(enquiry.createdAt)}</Text>
          <ChevronDown
            size={16}
            color="#94A3B8"
            strokeWidth={2}
            style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
          />
        </View>
      </View>
      {expanded ? (
        <View className="mt-3 rounded-xl border border-ink-100 bg-ink-50 px-3 py-3">
          <Text className="text-xs text-ink-600">{message || "No message included"}</Text>
          <Text className="mt-2 text-xs text-ink-400">
            {enquiry.phone} · sent as {enquiry.name}
          </Text>
        </View>
      ) : null}
    </AccentCard>
  );
}

export default function EnquiriesScreen() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<Enquiry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await customerApi.listEnquiries(page, PAGE_SIZE);
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load enquiries");
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
        <MessageSquare size={40} color="#94A3B8" strokeWidth={1.75} />
        <Text className="text-center text-ink-600">Sign in to view enquiries</Text>
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
        emptyMessage="No enquiries yet — message a business from its profile"
        emptyIcon={MessageSquare}
        onRetry={() => {
          setLoading(true);
          void load();
        }}
      >
        <FlatList
          data={items}
          keyExtractor={(enquiry) => enquiry.id}
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
          renderItem={({ item }) => <EnquiryRow enquiry={item} />}
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
