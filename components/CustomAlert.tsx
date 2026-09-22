import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { AlertTriangle, Info } from "lucide-react-native";
import { Button } from "./ui";

/**
 * Branded, app-wide alert dialog — a drop-in replacement for React Native's
 * `Alert.alert(title, message?, buttons?)`. Because the API is imperative and
 * backed by a module-level store, it also works from non-component modules
 * (e.g. `src/media/*`), which a hook could not.
 *
 * Usage: `showAlert("Cancel booking?", "You can rebook later.", [ ... ])`.
 * Mount `<AlertHost />` once at the root layout.
 */

export type AlertButtonStyle = "default" | "cancel" | "destructive";

export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
};

type AlertConfig = {
  title: string;
  message?: string;
  buttons: AlertButton[];
};

let current: AlertConfig | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  current = {
    title,
    message,
    buttons: buttons && buttons.length > 0 ? buttons : [{ text: "OK", style: "default" }],
  };
  emit();
}

function dismiss() {
  current = null;
  emit();
}

function variantFor(style?: AlertButtonStyle) {
  if (style === "destructive") return "danger" as const;
  if (style === "cancel") return "outline" as const;
  return "primary" as const;
}

export function AlertHost() {
  const [, force] = useState(0);
  useEffect(() => {
    const listener = () => force((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const config = current;
  const visible = config !== null;
  const isDestructive = config?.buttons.some((b) => b.style === "destructive") ?? false;
  const isRow = (config?.buttons.length ?? 0) === 2;

  function handlePress(btn: AlertButton) {
    dismiss();
    btn.onPress?.();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <Pressable className="flex-1 items-center justify-center bg-black/50 px-8" onPress={dismiss}>
        <Pressable
          className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl shadow-ink-900/20"
          onPress={() => {}}
        >
          {config ? (
            <>
              <View
                className={`mb-4 h-12 w-12 items-center justify-center rounded-full ${
                  isDestructive ? "bg-red-50" : "bg-brand-50"
                }`}
              >
                {isDestructive ? (
                  <AlertTriangle size={24} color="#DC2626" strokeWidth={2} />
                ) : (
                  <Info size={24} color="#2563EB" strokeWidth={2} />
                )}
              </View>

              <Text className="text-xl font-extrabold tracking-tight text-ink-900">
                {config.title}
              </Text>
              {config.message ? (
                <Text className="mt-2 text-sm leading-5 text-ink-500">{config.message}</Text>
              ) : null}

              <View className={`mt-6 ${isRow ? "flex-row gap-3" : "gap-3"}`}>
                {config.buttons.map((btn, i) => (
                  <Button
                    key={`${btn.text}-${i}`}
                    label={btn.text}
                    variant={variantFor(btn.style)}
                    onPress={() => handlePress(btn)}
                    className={isRow ? "flex-1" : ""}
                  />
                ))}
              </View>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
