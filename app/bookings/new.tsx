import { router, useLocalSearchParams } from "expo-router";
import { Calendar, Clock } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Field } from "../../components/Field";
import { KeyboardForm } from "../../components/KeyboardForm";
import { Button, ScreenState } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { bookingsApi } from "../../src/api/endpoints";
import type { AvailabilitySlot } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";

function todayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
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
      <View className="mt-4 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
        <View className="px-4 py-4">
          <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
          <Button label="Load slots" variant="secondary" onPress={() => void loadSlots()} />
        </View>
      </View>

      <ScreenState
        loading={loading}
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
