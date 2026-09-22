import { Redirect } from "expo-router";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { useAuth } from "../src/auth/AuthProvider";

export default function Index() {
  const { isReady, isAuthenticated } = useAuth();

  // Branded launch screen while auth boots — white background matches the
  // native splash so the handoff is seamless, then adds the wordmark + panel.
  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8">
        <Image
          source={require("../assets/splash-icon.png")}
          style={{ width: 92, height: 92 }}
          resizeMode="contain"
        />
        <Text className="mt-6 text-2xl font-extrabold tracking-tight text-ink-900">
          Hindustan Directory
        </Text>
        <Text className="mt-2 text-[11px] font-extrabold uppercase tracking-widest text-brand-600">
          Customer
        </Text>
        <ActivityIndicator className="mt-9" color="#2563EB" />
      </View>
    );
  }

  if (isAuthenticated) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/welcome" />;
}
