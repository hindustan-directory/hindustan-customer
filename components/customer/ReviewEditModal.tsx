import { Star } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SheetModal } from "./SheetModal";
import { Button } from "../ui";
import { ApiError } from "../../src/api/client";
import { customerApi } from "../../src/api/endpoints";

/** Server cap from customers.validation.ts */
const MAX_COMMENT = 2000;

type ExistingReview = {
  rating: number;
  comment?: string | null;
};

type Props = {
  visible: boolean;
  vendorId: string;
  businessName?: string;
  existingReview?: ExistingReview | null;
  onClose: () => void;
  onSaved: () => void;
};

function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          accessibilityRole="button"
          accessibilityLabel={`${star} star${star === 1 ? "" : "s"}`}
          accessibilityState={{ selected: value === star }}
          disabled={disabled}
          onPress={() => onChange(star)}
          className="rounded-lg p-1 active:bg-amber-50 disabled:opacity-60"
        >
          <Star
            size={28}
            color={star <= value ? "#F59E0B" : "#CBD5E1"}
            fill={star <= value ? "#F59E0B" : "transparent"}
            strokeWidth={star <= value ? 0 : 2}
          />
        </Pressable>
      ))}
      <Text className="ml-1.5 text-sm font-semibold text-ink-500">{value}/5</Text>
    </View>
  );
}

export function ReviewEditModal({
  visible,
  vendorId,
  businessName,
  existingReview,
  onClose,
  onSaved,
}: Props) {
  const isEditing = !!existingReview;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment ?? "");
    } else {
      setRating(5);
      setComment("");
    }
    setError(null);
  }, [visible, existingReview]);

  async function submit() {
    setError(null);
    const trimmed = comment.trim();
    if (trimmed.length > MAX_COMMENT) {
      setError(`Comment must be ${MAX_COMMENT} characters or fewer`);
      return;
    }
    setLoading(true);
    try {
      await customerApi.upsertReview({
        vendorId,
        rating,
        comment: trimmed || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save review");
    } finally {
      setLoading(false);
    }
  }

  const title = isEditing ? "Edit your review" : "Write a review";
  const subtitle = isEditing
    ? `Your review of ${businessName ?? "this business"}. Saving replaces what you wrote before.`
    : `Rate your experience with ${businessName ?? "this business"}.`;

  return (
    <SheetModal visible={visible} title={title} onClose={onClose}>
      <Text className="mb-4 text-sm text-ink-500">{subtitle}</Text>
      <Text className="mb-2 text-sm font-medium text-ink-700">Rating</Text>
      <View className="mb-4">
        <StarPicker value={rating} onChange={setRating} disabled={loading} />
      </View>
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-sm font-medium text-ink-700">Comment</Text>
        <Text className="text-xs font-medium text-ink-400">
          {comment.length}/{MAX_COMMENT}
        </Text>
      </View>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="What was your experience like? (optional)"
        placeholderTextColor="#94A3B8"
        multiline
        maxLength={MAX_COMMENT}
        editable={!loading}
        textAlignVertical="top"
        className="mb-3 min-h-[100px] rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-base text-ink-900"
      />
      {error ? <Text className="mb-2 text-sm text-red-600">{error}</Text> : null}
      <Button
        label={loading ? "Saving…" : isEditing ? "Save review" : "Submit review"}
        onPress={() => void submit()}
        loading={loading}
      />
      <Button label="Cancel" variant="outline" className="mt-2" onPress={onClose} disabled={loading} />
    </SheetModal>
  );
}
