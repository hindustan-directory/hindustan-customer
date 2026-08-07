import { Bell } from "lucide-react-native";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotificationsStub() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 items-center justify-center bg-ink-50 px-8"
      style={{ paddingTop: insets.top }}
    >
      <Bell size={40} color="#94A3B8" strokeWidth={1.75} />
      <Text className="mt-4 text-xl font-bold text-ink-900">Notifications</Text>
      <Text className="mt-2 text-center text-sm text-ink-500">
        In-app notification inbox is not available yet (API guide §14). Booking reminders are written
        server-side but have no read API.
      </Text>
    </View>
  );
}
