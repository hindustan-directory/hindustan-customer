import { Link, router } from "expo-router";
import { Search } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, GradientBox } from "../../components/ui";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
      <GradientBox
        className="flex-1"
        from="#2563EB"
        to="#1D4ED8"
        roundedBottom={false}
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-6 h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
            <Search size={32} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text className="text-[10px] font-extrabold uppercase tracking-widest text-brand-100">
            Customer panel
          </Text>
          <Text className="mt-3 text-center text-3xl font-extrabold tracking-tight text-white">
            Hindustan Directory
          </Text>
          <Text className="mt-3 max-w-xs text-center text-sm leading-5 text-brand-100">
            Discover trusted local businesses, save favourites, and book services across India.
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
            <Pressable className="py-3 active:opacity-80">
              <Text className="text-center text-sm font-medium text-brand-100">
                Continue browsing as guest
              </Text>
            </Pressable>
          </Link>
        </View>
      </GradientBox>
    </View>
  );
}
