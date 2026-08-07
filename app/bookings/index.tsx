import { router } from "expo-router";
import { Calendar } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Button, ScreenState } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { bookingsApi } from "../../src/api/endpoints";
import type { Booking } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";

export default function BookingsListScreen() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await bookingsApi.list(1, 50);
      setItems(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load bookings");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

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
    <ScreenState
      loading={loading}
      error={error}
      empty={!loading && items.length === 0}
      emptyMessage="No bookings yet"
      emptyIcon={Calendar}
      onRetry={() => {
        setLoading(true);
        void load();
      }}
    >
      <FlatList
        data={items}
        keyExtractor={(b) => b.id}
        contentContainerClassName="px-5 py-4"
        renderItem={({ item }) => (
          <View className="mb-3 rounded-2xl border border-ink-100 bg-white px-4 py-3">
            <Text className="font-semibold text-ink-900">
              {item.bookingDate} · {item.startTime.slice(0, 5)}–{item.endTime.slice(0, 5)}
            </Text>
            <Text className="mt-1 text-sm capitalize text-ink-500">{item.status.replace(/_/g, " ")}</Text>
            {item.status === "requested" || item.status === "confirmed" ? (
              <Pressable
                className="mt-2"
                onPress={() => {
                  void bookingsApi.cancel(item.id).then(load).catch((err) => {
                    setError(err instanceof ApiError ? err.message : "Cancel failed");
                  });
                }}
              >
                <Text className="text-sm text-red-600">Cancel</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      />
    </ScreenState>
  );
}
