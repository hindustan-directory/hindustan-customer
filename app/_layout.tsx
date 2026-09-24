import "react-native-gesture-handler";
import "../global.css";
import "../src/lib/setupImage";
import { Stack } from "expo-router";
import type { ErrorBoundaryProps } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CircleAlert } from "lucide-react-native";
import { Text, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { AlertHost } from "../components/CustomAlert";
import { HeaderBackButton } from "../components/HeaderBackButton";
import { Button } from "../components/ui";
import { AuthProvider } from "../src/auth/AuthProvider";
import { pushedHeaderOptions } from "../src/navigation/chrome";
import "react-native-css-interop/jsx-runtime";

/**
 * App-wide fallback. Expo-router auto-renders a route's exported `ErrorBoundary`
 * when a descendant throws during render; exporting it from the ROOT layout
 * gives every screen coverage. `retry` re-renders the failed subtree.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-ink-50 px-8">
      <StatusBar style="dark" />
      <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-50">
        <CircleAlert size={32} color="#2563EB" strokeWidth={1.75} />
      </View>
      <Text className="text-center text-xl font-bold text-ink-900">
        Something went wrong
      </Text>
      <Text className="text-center text-base text-ink-500">
        The app hit an unexpected error. You can try again — if it keeps
        happening, please restart the app.
      </Text>
      {__DEV__ && error?.message ? (
        <Text className="text-center text-xs text-ink-400">{error.message}</Text>
      ) : null}
      <Button label="Try again" onPress={retry} className="mt-2 self-stretch" />
    </View>
  );
}

function pushed(title: string) {
  return {
    ...pushedHeaderOptions,
    title,
    headerLeft: () => <HeaderBackButton />,
  };
}

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <AuthProvider>
        <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F8FAFC" },
          // No push animation — the slide felt laggy; swap screens instantly.
          animation: "none",
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="business/[slug]" options={pushed("Business")} />
        <Stack.Screen name="product/[id]" options={pushed("Product")} />
        <Stack.Screen name="bookings/index" options={pushed("My bookings")} />
        <Stack.Screen name="bookings/new" options={pushed("Book appointment")} />
        <Stack.Screen name="enquiries/index" options={pushed("My enquiries")} />
        <Stack.Screen name="reviews/index" options={pushed("My reviews")} />
        <Stack.Screen name="profile/edit" options={pushed("Edit profile")} />
        <Stack.Screen name="profile/change-password" options={pushed("Change password")} />
        <Stack.Screen name="profile/sessions" options={pushed("Active sessions")} />
        <Stack.Screen name="support/index" options={pushed("Support")} />
        <Stack.Screen name="support/new" options={pushed("Raise a ticket")} />
        <Stack.Screen name="support/[id]" options={pushed("Ticket")} />
        <Stack.Screen name="notifications" options={pushed("Notifications")} />
      </Stack>
      <AlertHost />
      </AuthProvider>
    </KeyboardProvider>
  );
}
