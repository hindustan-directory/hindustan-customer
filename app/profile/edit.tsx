import { router } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { Field } from "../../components/Field";
import { KeyboardForm } from "../../components/KeyboardForm";
import { Button } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { usersApi } from "../../src/api/endpoints";
import { useAuth } from "../../src/auth/AuthProvider";

export default function EditProfileScreen() {
  const { user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await usersApi.updateMe({
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      await refreshProfile();
      router.back();
    } catch (err) {
      if (err instanceof ApiError) {
        const next: Record<string, string> = {};
        for (const [k, v] of Object.entries(err.fieldErrors)) next[k] = v[0] ?? err.message;
        setFieldErrors(next);
        setError(Object.keys(next).length ? null : err.message);
      } else setError("Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardForm withHeader className="flex-1 bg-white" contentContainerClassName="px-5 py-4">
      <Field label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" error={fieldErrors.fullName} />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={fieldErrors.phone} />
      {error ? <Text className="mb-2 text-sm text-red-600">{error}</Text> : null}
      <Button label="Save" onPress={() => void save()} loading={loading} />
    </KeyboardForm>
  );
}
