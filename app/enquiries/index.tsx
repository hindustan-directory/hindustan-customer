import { router } from "expo-router";
import { MessageSquare } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Button, ScreenState } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { customerApi } from "../../src/api/endpoints";
import type { Enquiry } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";

export default function EnquiriesScreen() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const data = await customerApi.listEnquiries(1, 50);
      setItems(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load enquiries");
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
        <MessageSquare size={40} color="#94A3B8" strokeWidth={1.75} />
        <Text className="text-center text-ink-600">Sign in to view enquiries</Text>
        <Button label="Sign in" onPress={() => router.push("/(auth)/login")} />
      </View>
    );
  }

  return (
    <ScreenState
      loading={loading}
      error={error}
      empty={!loading && items.length === 0}
      emptyMessage="No enquiries yet"
      emptyIcon={MessageSquare}
      onRetry={() => {
        setLoading(true);
        void load();
      }}
    >
      <FlatList
        data={items}
        keyExtractor={(e) => e.id}
        contentContainerClassName="px-5 py-4"
        renderItem={({ item }) => (
          <View className="mb-3 rounded-2xl border border-ink-100 bg-white px-4 py-3">
            <Text className="font-semibold text-ink-900">{item.name}</Text>
            <Text className="text-xs text-ink-500">
              {item.phone} · {item.status}
            </Text>
            {item.message ? (
              <Text className="mt-2 text-sm text-ink-700">{item.message}</Text>
            ) : null}
          </View>
        )}
      />
    </ScreenState>
  );
}
