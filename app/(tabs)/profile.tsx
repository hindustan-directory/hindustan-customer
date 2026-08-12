import { Image } from "expo-image";
import { router } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import {
  Bell,
  Calendar,
  ChevronRight,
  HelpCircle,
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
import { AccentAvatar } from "../../components/customer/AccentCard";
import { accentFor } from "../../components/customer/accent";
import { Button } from "../../components/ui";
import { useAuth } from "../../src/auth/AuthProvider";

type SettingLink = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accentKey: string;
  auth?: boolean;
};

const SECTIONS: { title: string; links: SettingLink[] }[] = [
  {
    title: "My activity",
    links: [
      {
        label: "My bookings",
        description: "Upcoming and past appointments",
        href: "/bookings",
        icon: Calendar,
        accentKey: "bookings",
        auth: true,
      },
      {
        label: "My enquiries",
        description: "Messages sent to businesses",
        href: "/enquiries",
        icon: MessageSquare,
        accentKey: "enquiries",
        auth: true,
      },
      {
        label: "My reviews",
        description: "Ratings you've posted",
        href: "/reviews",
        icon: Star,
        accentKey: "reviews",
        auth: true,
      },
    ],
  },
  {
    title: "Account",
    links: [
      {
        label: "Edit profile",
        description: "Name, phone, and photo",
        href: "/profile/edit",
        icon: UserRoundPen,
        accentKey: "edit-profile",
        auth: true,
      },
      {
        label: "Change password",
        description: "Update your login password",
        href: "/profile/change-password",
        icon: KeyRound,
        accentKey: "password",
        auth: true,
      },
      {
        label: "Active sessions",
        description: "Devices signed into your account",
        href: "/profile/sessions",
        icon: MonitorSmartphone,
        accentKey: "sessions",
        auth: true,
      },
    ],
  },
  {
    title: "Help & more",
    links: [
      {
        label: "Support",
        description: "Get help with your account",
        href: "/support",
        icon: HelpCircle,
        accentKey: "support",
        auth: true,
      },
      {
        label: "Notifications",
        description: "Alerts and reminders",
        href: "/notifications",
        icon: Bell,
        accentKey: "notifications",
      },
    ],
  },
];

function SettingRow({ link }: { link: SettingLink }) {
  const accent = accentFor(link.accentKey);
  const Icon = link.icon;

  return (
    <Pressable
      onPress={() => router.push(link.href as never)}
      className="flex-row items-center gap-3 px-4 py-3.5 active:bg-ink-50"
    >
      <View className={`h-11 w-11 items-center justify-center rounded-2xl ${accent.iconWrap}`}>
        <Icon size={20} color={accent.icon} strokeWidth={2.25} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-base font-semibold text-ink-900">{link.label}</Text>
        <Text className="mt-0.5 text-xs text-ink-500">{link.description}</Text>
      </View>
      <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
    </Pressable>
  );
}

function SettingSection({
  title,
  links,
  isAuthenticated,
}: {
  title: string;
  links: SettingLink[];
  isAuthenticated: boolean;
}) {
  const visible = links.filter((link) => !link.auth || isAuthenticated);
  if (visible.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-ink-500">
        {title}
      </Text>
      <View className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
        {visible.map((link, index) => (
          <View key={link.href}>
            {index > 0 ? <View className="mx-4 border-t border-ink-100" /> : null}
            <SettingRow link={link} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, signOut } = useAuth();
  const profileAccent = accentFor(user?.email ?? "guest");
  const tabBarOffset = 56 + Math.max(insets.bottom, 10);

  return (
    <ScrollView
      className="flex-1 bg-ink-50"
      contentContainerStyle={{ paddingBottom: tabBarOffset + 8 }}
      style={{ paddingTop: insets.top }}
    >
      <Text className="px-5 pt-3 text-2xl font-bold text-ink-900">Profile</Text>

      <View className="mx-5 mt-4 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
        <View className="items-center px-5 py-6">
          {isAuthenticated && user ? (
            <View className="w-full items-center">
              {user.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  className="mb-4 h-20 w-20 rounded-2xl border-2 border-white bg-ink-100 shadow-sm"
                  contentFit="cover"
                />
              ) : (
                <View className="mb-4">
                  <AccentAvatar accentKey={user.email} label={user.fullName} size="md" />
                </View>
              )}
              <Text className="text-center text-xl font-bold text-ink-900" numberOfLines={2}>
                {user.fullName}
              </Text>
              <Text className="mt-1 text-center text-sm text-ink-500" numberOfLines={1}>
                {user.email}
              </Text>
              {user.phone ? (
                <Text className="text-center text-sm text-ink-500" numberOfLines={1}>
                  {user.phone}
                </Text>
              ) : null}
            </View>
          ) : (
            <View className="items-center gap-3 py-2">
              <View className={`rounded-full p-4 ${profileAccent.surface}`}>
                <User size={32} color={profileAccent.icon} strokeWidth={1.75} />
              </View>
              <Text className="text-center text-sm text-ink-600">
                Sign in to manage bookings, saved businesses, and your account
              </Text>
              <View className="w-full gap-2">
                <Button label="Sign in" onPress={() => router.push("/(auth)/login")} />
                <Button
                  label="Create account"
                  variant="secondary"
                  onPress={() => router.push("/(auth)/register")}
                />
              </View>
            </View>
          )}
        </View>
      </View>

      <View className="mt-5 px-5">
        {SECTIONS.map((section) => (
          <SettingSection
            key={section.title}
            title={section.title}
            links={section.links}
            isAuthenticated={isAuthenticated}
          />
        ))}

        {isAuthenticated ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void signOut().then(() => router.replace("/(auth)/welcome"));
            }}
            className="mt-3 flex-row items-center justify-center gap-2 pb-1 active:opacity-70"
          >
            <LogOut size={18} color="#DC2626" strokeWidth={2.25} />
            <Text className="text-base font-semibold text-red-600">Sign out</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}
