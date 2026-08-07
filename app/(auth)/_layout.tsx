import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#fff" },
        animation: "slide_from_right",
        gestureEnabled: true,
      }}
    />
  );
}
