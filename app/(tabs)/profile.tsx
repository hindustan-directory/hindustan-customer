import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  Bell,
  Calendar,
  ChevronRight,
  KeyRound,
  LogOut,
  MessageSquare,
  MonitorSmartphone,
  Star,
  User,
  UserRoundPen,
} from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../components/ui";
import { useAuth } from "../../src/auth/AuthProvider";

const links: { label: string; href: string; icon: LucideIcon; auth?: boolean }[] = [
  { label: "My bookings", href: "/bookings", icon: Calendar, auth: true },
  { label: "My enquiries", href: "/enquiries", icon: MessageSquare, auth: true },
  { label: "My reviews", href: "/reviews", icon: Star, auth: true },
  { label: "Edit profile", href: "/profile/edit", icon: UserRoundPen, auth: true },
  { label: "Change password", href: "/profile/change-password", icon: KeyRound, auth: true },
  { label: "Active sessions", href: "/profile/sessions", icon: MonitorSmartphone, auth: true },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, signOut } = useAuth();

  return (
    <ScrollView
      className="flex-1 bg-ink-50"
      contentContainerClassName="pb-10"
      style={{ paddingTop: insets.top }}
    >
      <View className="bg-white px-5 pb-6 pt-4">
        <Text className="text-2xl font-bold text-ink-900">Profile</Text>
        {isAuthenticated && user ? (
          <View className="mt-4">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-100">
              <Text className="text-xl font-bold text-brand-700">
                {user.fullName.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <Text className="mt-3 text-lg font-semibold text-ink-900">{user.fullName}</Text>
            <Text className="text-sm text-ink-500">{user.email}</Text>
            <Text className="text-sm text-ink-500">{user.phone}</Text>
          </View>
        ) : (
          <View className="mt-4 gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-ink-100">
              <User size={28} color="#64748B" strokeWidth={1.75} />
            </View>
            <Text className="text-ink-500">Sign in to manage bookings and favourites</Text>
            <Button label="Sign in" onPress={() => router.push("/(auth)/login")} />
            <Button
              label="Create account"
              variant="secondary"
              onPress={() => router.push("/(auth)/register")}
            />
          </View>
        )}
      </View>

      <View className="mt-4 mx-5 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        {links
          .filter((link) => !link.auth || isAuthenticated)
          .map((link, index) => {
            const Icon = link.icon;
            return (
              <Pressable
                key={link.href}
                onPress={() => router.push(link.href as never)}
                className={`flex-row items-center gap-3 px-4 py-4 active:bg-ink-50 ${
                  index > 0 ? "border-t border-ink-100" : ""
                }`}
              >
                <Icon size={20} color="#2563EB" strokeWidth={2} />
                <Text className="flex-1 text-base text-ink-900">{link.label}</Text>
                <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
              </Pressable>
            );
          })}
      </View>

      {isAuthenticated ? (
        <View className="mx-5 mt-6">
          <Button
            label="Sign out"
            variant="outline"
            icon={LogOut}
            onPress={() => {
              void signOut().then(() => router.replace("/(auth)/welcome"));
            }}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
