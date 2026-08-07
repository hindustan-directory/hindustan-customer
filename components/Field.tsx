import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  password?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words";
  error?: string;
  editable?: boolean;
};

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  password,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  error,
  editable = true,
}: Props) {
  const isPassword = password === true || secureTextEntry === true;
  const [visible, setVisible] = useState(false);

  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-sm font-medium text-ink-700">{label}</Text>
      <View
        className={`flex-row items-center rounded-xl border bg-white ${
          error ? "border-red-500" : "border-ink-200"
        }`}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={isPassword && !visible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          className={`flex-1 px-4 py-3.5 text-base text-ink-900 ${isPassword ? "pr-2" : ""}`}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide password" : "Show password"}
            hitSlop={8}
            onPress={() => setVisible((v) => !v)}
            className="h-11 w-11 items-center justify-center"
          >
            {visible ? (
              <EyeOff size={20} color="#64748B" />
            ) : (
              <Eye size={20} color="#64748B" />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="mt-1 text-xs text-red-600">{error}</Text> : null}
    </View>
  );
}
