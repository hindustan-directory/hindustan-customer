import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BackButton } from "../../components/BackButton";
import { Field } from "../../components/Field";
import { KeyboardForm } from "../../components/KeyboardForm";
import { Button } from "../../components/ui";
import { ApiError } from "../../src/api/client";
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
        setFormError(Object.keys(next).length ? null : err.message);
      } else {
        setFormError("Sign in failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardForm safeTop>
      <BackButton />
      <Text className="text-3xl font-bold text-ink-900">Welcome back</Text>
      <Text className="mt-2 text-base text-ink-500">Sign in to your customer account</Text>

      <View className="mt-8">
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
      </View>
    </KeyboardForm>
  );
}
