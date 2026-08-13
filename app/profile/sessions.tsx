import { router } from "expo-router";
import { MonitorSmartphone, Shield } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import { AccentCard, SecondaryAction } from "../../components/customer/AccentCard";
import { Button, ScreenState } from "../../components/ui";
import { ShimmerList } from "../../components/Shimmer";
import { ApiError } from "../../src/api/client";
import { authApi } from "../../src/api/endpoints";
import type { AuthSession } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";

import { formatSessionWhen } from "../../src/lib/datetime";

export default function SessionsScreen() {
  const { isAuthenticated, signOut } = useAuth();
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      setSessions(await authApi.listSessions());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load sessions");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  async function clearLocalAndWelcome() {
    await signOut();
    router.replace("/(auth)/welcome");
  }

  async function onRevoke(session: AuthSession) {
    setBusyId(session.id);
    setError(null);
    try {
      await authApi.revokeSession(session.id);
      if (session.isCurrent) {
        await clearLocalAndWelcome();
        return;
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not revoke session");
    } finally {
      setBusyId(null);
    }
  }

  function confirmRevokeAll() {
    Alert.alert(
      "Sign out everywhere?",
      "This revokes every device session, including this one.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out all",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setBusyId("__all__");
              setError(null);
              try {
                await authApi.revokeAllSessions();
                await clearLocalAndWelcome();
              } catch (err) {
                setError(
                  err instanceof ApiError ? err.message : "Could not revoke sessions",
                );
                setBusyId(null);
              }
            })();
          },
        },
      ],
    );
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <Shield size={40} color="#94A3B8" strokeWidth={1.75} />
        <Text className="text-center text-ink-600">Sign in to manage sessions</Text>
        <Button label="Sign in" onPress={() => router.push("/(auth)/login")} />
      </View>
    );
  }

  return (
    <ScreenState
      loading={loading}
      loadingShimmer={<ShimmerList className="px-5 py-4 pb-10" />}
      error={error}
      empty={!loading && !error && sessions.length === 0}
      emptyMessage="No active sessions"
      emptyIcon={MonitorSmartphone}
      onRetry={() => {
        setLoading(true);
        void load();
      }}
    >
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerClassName="px-5 py-4 pb-10"
        ListHeaderComponent={
          <View className="mb-4">
            <Text className="text-sm text-ink-500">
              Devices signed into your account. Revoke any you don’t recognize.
            </Text>
            <Button
              label="Sign out of all devices"
              variant="outline"
              className="mt-4"
              loading={busyId === "__all__"}
              onPress={confirmRevokeAll}
            />
          </View>
        }
        renderItem={({ item }) => (
          <AccentCard className="mb-3">
            <Text className="font-semibold text-ink-900">
              {item.deviceInfo?.trim() || "Unknown device"}
              {item.isCurrent ? " · This device" : ""}
            </Text>
            {item.ip ? (
              <Text className="mt-0.5 text-xs text-ink-500">IP {item.ip}</Text>
            ) : null}
            <Text className="mt-1 text-xs text-ink-500">
              Started {formatSessionWhen(item.createdAt)}
            </Text>
            <Text className="text-xs text-ink-400">Expires {formatSessionWhen(item.expiresAt)}</Text>
            <View className="mt-3">
              <SecondaryAction
                label={
                  busyId === item.id
                    ? "Revoking…"
                    : item.isCurrent
                      ? "Sign out this device"
                      : "Revoke"
                }
                disabled={busyId === item.id}
                onPress={() => void onRevoke(item)}
              />
            </View>
          </AccentCard>
        )}
      />
    </ScreenState>
  );
}
