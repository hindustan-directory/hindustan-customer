import { router, useLocalSearchParams } from "expo-router";
import { Calendar, Clock } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Field } from "../../components/Field";
import { KeyboardForm } from "../../components/KeyboardForm";
import { Button, ScreenState } from "../../components/ui";
import { ShimmerSlots } from "../../components/Shimmer";
import { ApiError } from "../../src/api/client";
import { bookingsApi } from "../../src/api/endpoints";
import type { AvailabilitySlot } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";

function localIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayIso() {
  return localIso(new Date());
}

export default function NewBookingScreen() {
  const { vendorId, name } = useLocalSearchParams<{ vendorId: string; name?: string }>();
  const { isAuthenticated } = useAuth();
  const [date, setDate] = useState(todayIso());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selected, setSelected] = useState<AvailabilitySlot | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Next 30 selectable days for the horizontal date picker.
  const dateOptions = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return {
        iso: localIso(d),
        weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
        day: String(d.getDate()),
        month: d.toLocaleDateString(undefined, { month: "short" }),
      };
    });
  }, []);

  const loadSlots = useCallback(async () => {
    if (!vendorId || !isAuthenticated) return;
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const data = await bookingsApi.availability(vendorId, date);
      setSlots(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load availability");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [vendorId, date, isAuthenticated]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  if (!isAuthenticated) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <Calendar size={40} color="#94A3B8" strokeWidth={1.75} />
        <Text className="mb-1 text-center text-ink-600">Sign in to book an appointment</Text>
        <Button label="Sign in" onPress={() => router.push("/(auth)/login")} />
      </View>
    );
  }

  async function submit() {
    if (!vendorId || !selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await bookingsApi.create({
        vendorId,
        bookingDate: date,
        startTime: selected.startTime.slice(0, 5),
        endTime: selected.endTime.slice(0, 5),
        notes: notes.trim() || undefined,
      });
      router.replace("/bookings");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardForm
      withHeader
      className="flex-1 bg-ink-50"
      contentContainerClassName="px-5 py-4 pb-10"
    >
      <Text className="text-lg font-semibold text-ink-900">{name ?? "Book appointment"}</Text>
      <View className="mt-4">
        <Text className="mb-2 text-sm font-semibold text-ink-700">Select a date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pr-4"
        >
          {dateOptions.map((d) => {
            const active = d.iso === date;
            return (
              <Pressable
                key={d.iso}
                onPress={() => setDate(d.iso)}
                className={`w-[60px] items-center rounded-2xl border px-2 py-3 ${
                  active ? "border-brand-600 bg-brand-600" : "border-ink-100 bg-white"
                }`}
              >
                <Text className={`text-xs font-medium ${active ? "text-brand-100" : "text-ink-500"}`}>
                  {d.weekday}
                </Text>
                <Text className={`text-xl font-bold ${active ? "text-white" : "text-ink-900"}`}>
                  {d.day}
                </Text>
                <Text className={`text-xs ${active ? "text-brand-100" : "text-ink-500"}`}>
                  {d.month}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScreenState
        loading={loading}
        loadingShimmer={<ShimmerSlots />}
        error={error}
        empty={!loading && slots.length === 0}
        emptyMessage="No slots for this date"
        emptyIcon={Clock}
      >
        <View className="mt-4 gap-2">
          {slots.map((slot) => {
            const key = `${slot.startTime}-${slot.endTime}`;
            const active =
              selected?.startTime === slot.startTime && selected?.endTime === slot.endTime;
            return (
              <Pressable
                key={key}
                disabled={!slot.isAvailable}
                onPress={() => setSelected(slot)}
                className={`rounded-xl border px-4 py-3 ${
                  active ? "border-brand-600 bg-brand-50" : "border-ink-100 bg-white"
                } ${slot.isAvailable ? "" : "opacity-40"}`}
              >
                <Text className="font-medium text-ink-900">
                  {slot.startTime.slice(0, 5)} – {slot.endTime.slice(0, 5)}
                </Text>
                <Text className="text-xs text-ink-500">
                  {slot.isAvailable
                    ? `${slot.remaining} remaining`
                    : "Unavailable"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScreenState>

      <View className="mt-4 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
        <View className="px-4 py-4">
          <Field label="Notes (optional)" value={notes} onChangeText={setNotes} autoCapitalize="sentences" />
          <Button
            label="Request booking"
            disabled={!selected}
            loading={submitting}
            onPress={() => void submit()}
          />
        </View>
      </View>
    </KeyboardForm>
  );
}
