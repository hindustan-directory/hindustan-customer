import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import { Send } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_TONE,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_TONE,
} from "../../components/customer/status";
import { ScreenState } from "../../components/ui";
import { ShimmerDetail } from "../../components/Shimmer";
import { ApiError } from "../../src/api/client";
import { ticketsApi } from "../../src/api/endpoints";
import type { Ticket, TicketNote } from "../../src/api/types";
import { useAuth } from "../../src/auth/AuthProvider";
import { formatCreatedDate, formatRelativeTime } from "../../src/lib/datetime";

const NOTES_PAGE_SIZE = 50;
const MAX_NOTE = 5000;

function NoteBubble({ note, isMine }: { note: TicketNote; isMine: boolean }) {
  return (
    <View className={`mb-3 max-w-[85%] ${isMine ? "self-end" : "self-start"}`}>
      <View
        className={`rounded-2xl px-3.5 py-2.5 ${
          isMine
            ? "rounded-br-md bg-brand-600"
            : "rounded-bl-md border border-ink-100 bg-white"
        }`}
      >
        {!isMine && note.author?.fullName ? (
          <Text className="mb-0.5 text-[11px] font-bold text-ink-500">
            {note.author.fullName}
            {note.author.role ? ` · ${note.author.role}` : ""}
          </Text>
        ) : null}
        <Text className={`text-sm ${isMine ? "text-white" : "text-ink-800"}`}>
          {note.note}
        </Text>
      </View>
      <Text
        className={`mt-1 text-[10px] text-ink-400 ${isMine ? "text-right" : "text-left"}`}
      >
        {formatRelativeTime(note.createdAt)}
      </Text>
    </View>
  );
}

function TicketHeaderCard({ ticket }: { ticket: Ticket }) {
  return (
    <View className="mb-4 overflow-hidden rounded-3xl border border-ink-100 bg-white p-4 shadow-sm">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="min-w-0 flex-1 text-lg font-bold text-ink-900">
          {ticket.subject}
        </Text>
        <Text className="text-xs font-semibold text-ink-400">#{ticket.ticketNo}</Text>
      </View>
      <View className="mt-2 flex-row flex-wrap items-center gap-2">
        <View
          className={`rounded-full border px-2.5 py-0.5 ${TICKET_STATUS_TONE[ticket.status]}`}
        >
          <Text className="text-[11px] font-bold">
            {TICKET_STATUS_LABELS[ticket.status]}
          </Text>
        </View>
        <View
          className={`rounded-full border px-2.5 py-0.5 ${TICKET_PRIORITY_TONE[ticket.priority]}`}
        >
          <Text className="text-[11px] font-bold">
            {TICKET_PRIORITY_LABELS[ticket.priority]} priority
          </Text>
        </View>
      </View>
      <Text className="mt-3 text-sm text-ink-700">{ticket.description}</Text>
      <Text className="mt-3 text-[11px] text-ink-400">
        Opened {formatCreatedDate(ticket.createdAt)}
      </Text>
    </View>
  );
}

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [notes, setNotes] = useState<TicketNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const listRef = useRef<FlashListRef<TicketNote>>(null);

  // Guards post-await setState so a slow response can't update after unmount.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // With edge-to-edge on Android, adjustResize + KeyboardAvoidingView don't lift
  // content — track the keyboard height and pad the screen up by it ourselves.
  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvt, (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToEnd = useCallback(() => {
    // Defer so the list has laid out the new content before scrolling.
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [ticketData, notesData] = await Promise.all([
        ticketsApi.get(id),
        ticketsApi.listNotes(id, { pageSize: NOTES_PAGE_SIZE }),
      ]);
      if (!mounted.current) return;
      setTicket(ticketData);
      setNotes(notesData.items);
      scrollToEnd();
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof ApiError ? err.message : "Could not load ticket");
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [id, scrollToEnd]);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendReply() {
    if (!id) return;
    const trimmed = reply.trim();
    if (!trimmed) return;
    setSending(true);
    setError(null);
    try {
      const note = await ticketsApi.addNote(id, trimmed);
      if (!mounted.current) return;
      setNotes((prev) => [...prev, note]);
      setReply("");
      scrollToEnd();
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof ApiError ? err.message : "Could not send reply");
    } finally {
      if (mounted.current) setSending(false);
    }
  }

  return (
    <View
      className="flex-1 bg-ink-50"
      // Edge-to-edge: the view extends behind the gesture bar but the keyboard
      // height doesn't count that region, so add insets.bottom back to the lift.
      style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + insets.bottom : 0 }}
    >
      <ScreenState
        loading={loading}
        loadingShimmer={<ShimmerDetail />}
        error={error && !ticket ? error : null}
        onRetry={() => {
          setLoading(true);
          void load();
        }}
      >
        <FlashList
          ref={listRef}
          data={notes}
          keyExtractor={(note) => note.id}
          contentContainerClassName="px-5 py-4"
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
          ListHeaderComponent={ticket ? <TicketHeaderCard ticket={ticket} /> : null}
          ListEmptyComponent={
            <Text className="mt-2 text-center text-sm text-ink-400">
              No replies yet — add a message below and our team will respond.
            </Text>
          }
          renderItem={({ item }) => (
            <NoteBubble note={item} isMine={item.authorId === user?.id} />
          )}
        />
      </ScreenState>

      {ticket ? (
        <View
          className="border-t border-ink-100 bg-white px-4 pt-2"
          style={{ paddingBottom: keyboardHeight > 0 ? 8 : Math.max(insets.bottom, 10) }}
        >
          {error && ticket ? (
            <Text className="mb-1 px-1 text-xs text-rose-600">{error}</Text>
          ) : null}
          <View className="flex-row items-end gap-2">
            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder="Write a reply…"
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={MAX_NOTE}
              editable={!sending}
              className="max-h-28 min-h-[44px] flex-1 rounded-2xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-base text-ink-900"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send reply"
              disabled={sending || !reply.trim()}
              onPress={() => void sendReply()}
              className={`h-11 w-11 items-center justify-center rounded-full bg-brand-600 active:bg-brand-700 ${
                sending || !reply.trim() ? "opacity-40" : ""
              }`}
            >
              <Send size={18} color="#FFFFFF" strokeWidth={2.25} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
