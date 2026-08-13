import { router } from "expo-router";
import { Calendar } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { AccentCard, SecondaryAction } from "../../components/customer/AccentCard";
import { ListPagination } from "../../components/customer/ListPagination";
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_TONE,
} from "../../components/customer/status";
import { Button, ScreenState } from "../../components/ui";
import { ShimmerList } from "../../components/Shimmer";
import { ApiError } from "../../src/api/client";
import { bookingsApi } from "../../src/api/endpoints";
import type { Booking } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";
import {
  formatBookingDate,
  formatSlotTime,
  isUpcomingBooking,
  todayUtcMidnight,
} from "../../src/lib/datetime";

const PAGE_SIZE = 10;
const CANCELLABLE = new Set(["requested", "confirmed"]);
type Tab = "upcoming" | "past";

export default function BookingsListScreen() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const todayUtc = useMemo(() => todayUtcMidnight(), []);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await bookingsApi.list(page, PAGE_SIZE);
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleItems = useMemo(() => {
    return items.filter((booking) => {
      const upcoming = isUpcomingBooking(booking.bookingDate, todayUtc);
      return tab === "upcoming" ? upcoming : !upcoming;
    });
  }, [items, tab, todayUtc]);

  function confirmCancel(booking: Booking) {
    Alert.alert(
      "Cancel booking?",
      `${formatBookingDate(booking.bookingDate)} · ${formatSlotTime(booking.startTime)}–${formatSlotTime(booking.endTime)}`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: () => {
            setCancellingId(booking.id);
            void bookingsApi
              .cancel(booking.id)
              .then(() => load())
              .catch((err) => {
                setError(err instanceof ApiError ? err.message : "Cancel failed");
              })
              .finally(() => setCancellingId(null));
          },
        },
      ],
    );
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <Calendar size={40} color="#94A3B8" strokeWidth={1.75} />
        <Text className="mb-1 text-center text-ink-600">Sign in to view bookings</Text>
        <Button label="Sign in" onPress={() => router.push("/(auth)/login")} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink-50">
      <View className="flex-row gap-2 border-b border-ink-100 bg-white px-5 py-3">
        {(["upcoming", "past"] as const).map((value) => (
          <Pressable
            key={value}
            onPress={() => setTab(value)}
            className={`flex-1 items-center rounded-xl py-2.5 ${
              tab === value ? "bg-brand-600" : "bg-ink-100"
            }`}
          >
            <Text
              className={`text-sm font-semibold capitalize ${
                tab === value ? "text-white" : "text-ink-600"
              }`}
            >
              {value}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScreenState
        loading={loading}
        loadingShimmer={<ShimmerList className="px-5 py-4 pb-4" />}
        error={error}
        empty={!loading && !error && visibleItems.length === 0}
        emptyMessage={
          tab === "upcoming" ? "No upcoming bookings on this page" : "No past bookings on this page"
        }
        emptyIcon={Calendar}
        onRetry={() => {
          setLoading(true);
          void load();
        }}
      >
        <FlatList
          data={visibleItems}
          keyExtractor={(booking) => booking.id}
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
          renderItem={({ item }) => (
              <AccentCard className="mb-3">
                {item.vendor?.slug ? (
                  <Pressable onPress={() => router.push(`/business/${item.vendor!.slug}`)}>
                    <Text className="text-base font-semibold text-brand-700">
                      {item.vendor.businessName}
                    </Text>
                  </Pressable>
                ) : (
                  <Text className="text-base font-semibold text-ink-900">Booking</Text>
                )}
                <Text className="mt-1 text-sm text-ink-700">
                  {formatBookingDate(item.bookingDate)} · {formatSlotTime(item.startTime)}–
                  {formatSlotTime(item.endTime)}
                </Text>
                <View
                  className={`mt-2 self-start rounded-full border px-2.5 py-0.5 ${BOOKING_STATUS_TONE[item.status]}`}
                >
                  <Text className="text-xs font-semibold">{BOOKING_STATUS_LABELS[item.status]}</Text>
                </View>
                {item.notes ? (
                  <Text className="mt-2 text-sm text-ink-600">{item.notes}</Text>
                ) : null}
                {CANCELLABLE.has(item.status) ? (
                  <View className="mt-3">
                    <SecondaryAction
                      label={cancellingId === item.id ? "Cancelling…" : "Cancel booking"}
                      disabled={cancellingId === item.id}
                      onPress={() => confirmCancel(item)}
                    />
                  </View>
                ) : null}
              </AccentCard>
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
