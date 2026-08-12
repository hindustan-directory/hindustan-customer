import "react-native-gesture-handler";
import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { HeaderBackButton } from "../components/HeaderBackButton";
import { AuthProvider } from "../src/auth/AuthProvider";
import { pushedHeaderOptions } from "../src/navigation/chrome";
import "react-native-css-interop/jsx-runtime";

function pushed(title: string) {
  return {
    ...pushedHeaderOptions,
    title,
    headerLeft: () => <HeaderBackButton />,
  };
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#F8FAFC" },
          // Native stack: Android system / predictive back pops routes by default.
          animation: "slide_from_right",
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="business/[slug]" options={pushed("Business")} />
        <Stack.Screen name="bookings/index" options={pushed("My bookings")} />
        <Stack.Screen name="bookings/new" options={pushed("Book appointment")} />
        <Stack.Screen name="enquiries/index" options={pushed("My enquiries")} />
        <Stack.Screen name="reviews/index" options={pushed("My reviews")} />
        <Stack.Screen name="profile/edit" options={pushed("Edit profile")} />
        <Stack.Screen name="profile/change-password" options={pushed("Change password")} />
        <Stack.Screen name="profile/sessions" options={pushed("Active sessions")} />
        <Stack.Screen name="support" options={pushed("Support")} />
        <Stack.Screen name="notifications" options={pushed("Notifications")} />
      </Stack>
    </AuthProvider>
  );
}
