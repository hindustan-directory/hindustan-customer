import { Link, router } from "expo-router";
import { Building2 } from "lucide-react-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/ui";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-brand-600"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-3xl bg-white/20">
          <Building2 size={40} color="#FFFFFF" strokeWidth={2} />
        </View>
        <Text className="text-center text-3xl font-bold text-white">Hindustan Directory</Text>
        <Text className="mt-3 text-center text-base text-brand-100">
          Discover trusted local businesses across India
        </Text>
      </View>
      <View className="gap-3 px-6 pb-6">
        <Button label="Sign in" variant="onBrand" onPress={() => router.push("/(auth)/login")} />
        <Button
          label="Create account"
          variant="outlineOnBrand"
          onPress={() => router.push("/(auth)/register")}
        />
        <Link href="/(tabs)" asChild>
          <Text className="py-3 text-center text-sm font-medium text-brand-100">
            Continue browsing as guest
          </Text>
        </Link>
      </View>
    </View>
  );
}
