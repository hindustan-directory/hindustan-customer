import { router, useLocalSearchParams } from "expo-router";
import { Lock } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { BackButton } from "../../components/BackButton";
import { Field } from "../../components/Field";
import { KeyboardForm } from "../../components/KeyboardForm";
import { Button, Card } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { authApi } from "../../src/api/endpoints";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await authApi.resetPassword(token.trim(), newPassword);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        const next: Record<string, string> = {};
        for (const [key, messages] of Object.entries(err.fieldErrors)) {
          next[key] = messages[0] ?? err.message;
        }
        setFieldErrors(next);
        setError(Object.keys(next).length ? null : err.message);
      } else {
        setError("Reset failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardForm
      safeTop
      className="flex-1 bg-ink-50"
      contentContainerClassName="flex-grow justify-center px-5 pb-10 pt-2"
    >
      <View className="mb-4">
        <BackButton />
      </View>

      <Card className="overflow-hidden p-5">
        <View className="mb-6 items-center">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
            <Lock size={28} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text className="text-center text-2xl font-extrabold tracking-tight text-ink-900">
            Reset password
          </Text>
          <Text className="mt-1.5 text-center text-sm leading-5 text-ink-500">
            Choose a new password for your customer account
          </Text>
        </View>

        {done ? (
          <>
            <Text className="mb-4 text-sm text-emerald-700">
              Password updated. You can sign in now.
            </Text>
            <Button label="Go to sign in" onPress={() => router.replace("/(auth)/login")} />
          </>
        ) : (
          <>
            <Field label="Reset token" value={token} onChangeText={setToken} error={fieldErrors.token} />
            <Field
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              error={fieldErrors.newPassword}
            />
            {error ? <Text className="mb-3 text-sm text-rose-600">{error}</Text> : null}
            <Button label="Reset password" onPress={onSubmit} loading={loading} />
          </>
        )}
      </Card>
    </KeyboardForm>
  );
}
