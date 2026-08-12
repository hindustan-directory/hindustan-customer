import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Field } from "../../components/Field";
import { KeyboardForm } from "../../components/KeyboardForm";
import { Button } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { authApi } from "../../src/api/endpoints";

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      router.back();
    } catch (err) {
      if (err instanceof ApiError) {
        const next: Record<string, string> = {};
        for (const [k, v] of Object.entries(err.fieldErrors)) next[k] = v[0] ?? err.message;
        setFieldErrors(next);
        setError(Object.keys(next).length ? null : err.message);
      } else setError("Could not change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardForm withHeader className="flex-1 bg-ink-50" contentContainerClassName="px-5 py-4">
      <View className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
        <View className="px-4 py-4">
          <Text className="mb-4 text-sm text-ink-500">
            Choose a strong password you haven&apos;t used elsewhere.
          </Text>
          <Field
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            error={fieldErrors.currentPassword}
          />
          <Field
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            error={fieldErrors.newPassword}
          />
          {error ? <Text className="mb-2 text-sm text-red-600">{error}</Text> : null}
          <Button label="Update password" onPress={() => void save()} loading={loading} />
        </View>
      </View>
    </KeyboardForm>
  );
}
