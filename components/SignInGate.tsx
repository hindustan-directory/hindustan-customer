import { router } from "expo-router";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../src/auth/AuthProvider";
import { Button } from "./ui";

type Props = {
  message: string;
  children?: ReactNode;
};

export function SignInGate({ message, children }: Props) {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <View
        className="flex-1 items-center justify-center gap-3 px-6"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-center text-ink-600">{message}</Text>
        <Button label="Sign in" onPress={() => router.push("/(auth)/login")} />
      </View>
    );
  }

  return <>{children}</>;
}
