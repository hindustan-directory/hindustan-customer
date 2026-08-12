import { Image } from "expo-image";
import { router } from "expo-router";
import { Camera } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Field } from "../../components/Field";
import { KeyboardForm } from "../../components/KeyboardForm";
import { Button } from "../../components/ui";
import { ApiError } from "../../src/api/client";
import { usersApi } from "../../src/api/endpoints";
import { useAuth } from "../../src/auth/AuthProvider";
import { pickImage } from "../../src/media/pickImage";

export default function EditProfileScreen() {
  const { user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  async function changeAvatar() {
    const uri = await pickImage();
    if (!uri) return;
    setAvatarBusy(true);
    setError(null);
    try {
      const updated = await usersApi.uploadAvatar(uri);
      setAvatarUrl(updated.avatarUrl);
      await refreshProfile();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Avatar upload failed");
    } finally {
      setAvatarBusy(false);
    }
  }

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
    <KeyboardForm withHeader className="flex-1 bg-ink-50" contentContainerClassName="px-5 py-4">
      <View className="mb-4 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
        <View className="items-center px-4 py-5">
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="mb-3 h-24 w-24 rounded-full border border-ink-100 bg-ink-100"
              contentFit="cover"
            />
          ) : (
            <View className="mb-3 h-24 w-24 items-center justify-center rounded-full border border-dashed border-ink-200 bg-ink-50">
              <Camera size={28} color="#94A3B8" strokeWidth={1.75} />
            </View>
          )}
          <Pressable
            disabled={avatarBusy}
            onPress={() => void changeAvatar()}
            className="rounded-full border border-ink-200 bg-ink-50 px-4 py-2 active:bg-brand-50"
          >
            <Text className="text-sm font-semibold text-brand-600">
              {avatarBusy ? "Uploading…" : avatarUrl ? "Change photo" : "Add photo"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
        <View className="px-4 py-4">
          <Field label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" error={fieldErrors.fullName} />
          <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={fieldErrors.phone} />
          <Field label="Email" value={user?.email ?? ""} onChangeText={() => undefined} editable={false} />
          {error ? <Text className="mb-2 text-sm text-red-600">{error}</Text> : null}
          <Button label="Save changes" onPress={() => void save()} loading={loading} />
        </View>
      </View>
    </KeyboardForm>
  );
}
