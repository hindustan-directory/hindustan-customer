import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BackButton } from "../../components/BackButton";
import { Field } from "../../components/Field";
import { KeyboardForm } from "../../components/KeyboardForm";
import { Button } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthProvider";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setFormError(null);
    setFieldErrors({});
    if (!agreedToTerms) {
      setFieldErrors({ agreeToTerms: "You must agree to the terms to continue" });
      return;
    }
    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        agreeToTerms: true,
        city: city.trim() || undefined,
      });
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
        setFormError("Registration failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardForm safeTop>
      <BackButton />
      <Text className="text-3xl font-bold text-ink-900">Create account</Text>
      <Text className="mt-2 text-base text-ink-500">Join Hindustan Directory as a customer</Text>

      <View className="mt-8">
        <Field label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" error={fieldErrors.fullName} />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" error={fieldErrors.email} />
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={fieldErrors.phone} />
        <Field label="City (optional)" value={city} onChangeText={setCity} autoCapitalize="words" error={fieldErrors.city} />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry error={fieldErrors.password} />

        <Pressable
          onPress={() => setAgreedToTerms((v) => !v)}
          className="mb-3 flex-row items-start gap-3 py-1"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreedToTerms }}
        >
          <View
            className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${
              agreedToTerms ? "border-brand-600 bg-brand-600" : "border-ink-300 bg-white"
            }`}
          >
            {agreedToTerms ? <Text className="text-xs font-bold text-white">✓</Text> : null}
          </View>
          <Text className="flex-1 text-sm leading-5 text-ink-600">
            I agree to the Terms of Service and Privacy Policy
          </Text>
        </Pressable>
        {fieldErrors.agreeToTerms ? (
          <Text className="mb-3 text-sm text-red-600">{fieldErrors.agreeToTerms}</Text>
        ) : null}

        {formError ? <Text className="mb-3 text-sm text-red-600">{formError}</Text> : null}
        <Button label="Create account" onPress={onSubmit} loading={loading} />
        <Link href="/(auth)/login" asChild>
          <Pressable className="mt-4 py-2">
            <Text className="text-center text-sm text-ink-500">
              Already have an account? <Text className="font-semibold text-brand-600">Sign in</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardForm>
  );
}
