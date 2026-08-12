import { HelpCircle } from "lucide-react-native";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { Button } from "../components/ui";

export default function SupportScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-ink-50 px-8">
      <HelpCircle size={40} color="#94A3B8" strokeWidth={1.75} />
      <Text className="mt-4 text-xl font-bold text-ink-900">Customer support</Text>
      <Text className="mt-2 text-center text-sm text-ink-500">
        Raising and tracking support tickets will be available once the support API is live
        (Milestone 2).
      </Text>
      <Button
        label="Back to bookings"
        variant="secondary"
        className="mt-6"
        onPress={() => router.push("/bookings")}
      />
    </View>
  );
}
