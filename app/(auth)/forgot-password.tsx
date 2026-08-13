import { router } from "expo-router";
import { KeyRound } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { BackButton } from "../../components/BackButton";
import { Field } from "../../components/Field";
import { KeyboardForm } from "../../components/KeyboardForm";
import { Button, Card } from "../../components/ui";
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
      if (__DEV__ && data.devResetToken) setDevToken(data.devResetToken);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed");
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
            <KeyRound size={28} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text className="text-center text-2xl font-extrabold tracking-tight text-ink-900">
            Forgot password
          </Text>
          <Text className="mt-1.5 text-center text-sm leading-5 text-ink-500">
            We will email a reset link if the account exists
          </Text>
        </View>

        <Field label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
        {error ? <Text className="mb-3 text-sm text-rose-600">{error}</Text> : null}
        {message ? <Text className="mb-3 text-sm text-emerald-700">{message}</Text> : null}
        {__DEV__ && devToken ? (
          <Text className="mb-3 text-xs text-ink-500">Dev token (local only): {devToken}</Text>
        ) : null}
        <Button label="Send reset email" onPress={onSubmit} loading={loading} />
        {__DEV__ && devToken ? (
          <Button
            label="Continue to reset"
            variant="secondary"
            className="mt-3"
            onPress={() =>
              router.push({ pathname: "/(auth)/reset-password", params: { token: devToken } })
            }
          />
        ) : null}
      </Card>
    </KeyboardForm>
  );
}
