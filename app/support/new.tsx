import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Field } from "../../components/Field";
import { KeyboardForm } from "../../components/KeyboardForm";
import { TICKET_PRIORITY_LABELS } from "../../components/customer/status";
import { Button } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { ticketsApi } from "../../src/api/endpoints";
import type { TicketPriority } from "../../src/api/types";

/** Server caps (tickets.validation.ts). */
const MAX_SUBJECT = 200;
const MAX_DESCRIPTION = 5000;

const PRIORITIES: TicketPriority[] = ["low", "medium", "high"];

export default function NewTicketScreen() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ subject?: string; description?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();
    const nextFieldError: { subject?: string; description?: string } = {};
    if (!trimmedSubject) nextFieldError.subject = "Subject is required";
    else if (trimmedSubject.length > MAX_SUBJECT)
      nextFieldError.subject = `Subject must be ${MAX_SUBJECT} characters or fewer`;
    if (!trimmedDescription) nextFieldError.description = "Description is required";
    setFieldError(nextFieldError);
    if (nextFieldError.subject || nextFieldError.description) return;

    setError(null);
    setSubmitting(true);
    try {
      const ticket = await ticketsApi.create({
        subject: trimmedSubject,
        description: trimmedDescription,
        priority,
      });
      router.replace(`/support/${ticket.id}` as never);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create ticket");
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
      <View className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
        <View className="px-4 py-4">
          <Field
            label="Subject"
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief summary of the issue"
            autoCapitalize="sentences"
            error={fieldError.subject}
          />

          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-ink-700">Description</Text>
            <Text className="text-xs font-medium text-ink-400">
              {description.length}/{MAX_DESCRIPTION}
            </Text>
          </View>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Tell us what's happening and any steps to reproduce"
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={MAX_DESCRIPTION}
            editable={!submitting}
            textAlignVertical="top"
            className={`mb-1.5 min-h-[120px] rounded-xl border bg-ink-50 px-4 py-3 text-base text-ink-900 ${
              fieldError.description ? "border-rose-500" : "border-ink-200"
            }`}
          />
          {fieldError.description ? (
            <Text className="mb-3 text-xs text-rose-600">{fieldError.description}</Text>
          ) : (
            <View className="mb-3" />
          )}

          <Text className="mb-2 text-sm font-medium text-ink-700">Priority</Text>
          <View className="mb-1 flex-row gap-2">
            {PRIORITIES.map((option) => {
              const active = priority === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  disabled={submitting}
                  onPress={() => setPriority(option)}
                  className={`flex-1 items-center rounded-xl border px-3 py-2.5 ${
                    active
                      ? "border-brand-600 bg-brand-50"
                      : "border-ink-200 bg-white active:bg-ink-50"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      active ? "text-brand-700" : "text-ink-600"
                    }`}
                  >
                    {TICKET_PRIORITY_LABELS[option]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {error ? (
        <Text className="mt-3 px-1 text-sm text-rose-600">{error}</Text>
      ) : null}

      <Button
        label="Submit ticket"
        className="mt-4"
        loading={submitting}
        onPress={() => void submit()}
      />
    </KeyboardForm>
  );
}
