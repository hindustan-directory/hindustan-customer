import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { BackButton } from "../../components/BackButton";
import { Field } from "../../components/Field";
import { KeyboardForm } from "../../components/KeyboardForm";
import { Button } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { authApi } from "../../src/api/endpoints";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setMessage(null);
    setDevToken(null);
    setLoading(true);
    try {
      const data = await authApi.forgotPassword(email.trim());
      setMessage(data.message);
      if (data.devResetToken) setDevToken(data.devResetToken);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardForm safeTop>
      <BackButton />
      <Text className="text-3xl font-bold text-ink-900">Forgot password</Text>
      <Text className="mt-2 text-base text-ink-500">We will email a reset link if the account exists</Text>
      <View className="mt-8">
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        {error ? <Text className="mb-3 text-sm text-red-600">{error}</Text> : null}
        {message ? <Text className="mb-3 text-sm text-green-700">{message}</Text> : null}
        {devToken ? (
          <Text className="mb-3 text-xs text-ink-500">
            Dev token (local only): {devToken}
          </Text>
        ) : null}
        <Button label="Send reset email" onPress={onSubmit} loading={loading} />
        {devToken ? (
          <Button
            label="Continue to reset"
            variant="secondary"
            className="mt-3"
            onPress={() =>
              router.push({ pathname: "/(auth)/reset-password", params: { token: devToken } })
            }
          />
        ) : null}
      </View>
    </KeyboardForm>
  );
}
