import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { BackButton } from "../../components/BackButton";
import { Field } from "../../components/Field";
import { KeyboardForm } from "../../components/KeyboardForm";
import { Button } from "../../components/ui";
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
    <KeyboardForm safeTop>
      <BackButton />
      <Text className="text-3xl font-bold text-ink-900">Reset password</Text>
      {done ? (
        <View className="mt-8 gap-3">
          <Text className="text-base text-green-700">Password updated. You can sign in now.</Text>
          <Button label="Go to sign in" onPress={() => router.replace("/(auth)/login")} />
        </View>
      ) : (
        <View className="mt-8">
          <Field label="Reset token" value={token} onChangeText={setToken} error={fieldErrors.token} />
          <Field
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            error={fieldErrors.newPassword}
          />
          {error ? <Text className="mb-3 text-sm text-red-600">{error}</Text> : null}
          <Button label="Reset password" onPress={onSubmit} loading={loading} />
        </View>
      )}
    </KeyboardForm>
  );
}
