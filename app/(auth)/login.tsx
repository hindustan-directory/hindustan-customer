import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BackButton } from "../../components/BackButton";
import { Field } from "../../components/Field";
import { KeyboardForm } from "../../components/KeyboardForm";
import { Button, Card, GradientBox } from "../../components/ui";
import { ApiError, API_BASE_URL } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthProvider";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setFormError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (err) {
      if (err instanceof ApiError) {
        const next: Record<string, string> = {};
        for (const [key, messages] of Object.entries(err.fieldErrors)) {
          next[key] = messages[0] ?? err.message;
        }
        setFieldErrors(next);
        if (Object.keys(next).length) {
          setFormError(null);
        } else if (
          err.code === "NETWORK" ||
          /NoRouteToHost|Host unreachable|fetch failed/i.test(err.message)
        ) {
          setFormError(`Cannot reach server at ${API_BASE_URL}`);
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError(err instanceof Error ? err.message : "Sign in failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardForm safeTop className="flex-1 bg-ink-50" contentContainerClassName="pb-8">
      <GradientBox className="px-6 pb-10 pt-2" from="#2563EB" to="#4F46E5">
        <View className="absolute -right-8 top-0 h-32 w-32 rounded-full bg-white/10" />
        <BackButton onDark />
        <Text className="text-3xl font-bold text-white">Welcome back</Text>
        <Text className="mt-2 text-base text-brand-100">Sign in to your customer account</Text>
      </GradientBox>

      <Card className="mx-6 -mt-5 px-5 py-6">
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          error={fieldErrors.email}
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          error={fieldErrors.password}
        />
        {formError ? <Text className="mb-3 text-sm text-red-600">{formError}</Text> : null}
        <Button label="Sign in" onPress={onSubmit} loading={loading} />
        <Link href="/(auth)/forgot-password" asChild>
          <Pressable className="mt-4 py-2">
            <Text className="text-center text-sm text-brand-600">Forgot password?</Text>
          </Pressable>
        </Link>
        <Link href="/(auth)/register" asChild>
          <Pressable className="mt-2 py-2">
            <Text className="text-center text-sm text-ink-500">
              New here? <Text className="font-semibold text-brand-600">Create account</Text>
            </Text>
          </Pressable>
        </Link>
      </Card>
    </KeyboardForm>
  );
}
