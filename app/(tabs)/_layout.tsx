import { Tabs } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { Heart, Home, Search, User } from "lucide-react-native";
import { Platform, type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../../src/navigation/chrome";

/** Icon + label row; total bar height = this + bottom inset. */
const TAB_CONTENT_HEIGHT = 56;

function tabColor(color: ColorValue): string {
  return typeof color === "string" ? color : colors.brand600;
}

function TabBarIcon({
  icon: Icon,
  color,
  focused,
  filled,
}: {
  icon: LucideIcon;
  color: string;
  focused: boolean;
  filled?: boolean;
}) {
  return (
    <Icon
      size={24}
      color={color}
      strokeWidth={focused ? 2.5 : 2}
      fill={filled && focused ? color : "transparent"}
      opacity={focused ? 1 : 0.55}
    />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Floor so labels never sit flush on the home indicator / gesture bar.
  const paddingBottom = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand600,
        tabBarInactiveTintColor: colors.ink400,
        tabBarHideOnKeyboard: true,
        tabBarAllowFontScaling: false,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginTop: 2,
          lineHeight: 12,
        },
        tabBarItemStyle: {
          flex: 1,
          minHeight: TAB_CONTENT_HEIGHT,
          paddingTop: 6,
          justifyContent: "center",
        },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.ink100,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          height: TAB_CONTENT_HEIGHT + paddingBottom,
          paddingTop: 4,
          paddingBottom,
          overflow: "visible",
          ...Platform.select({
            ios: {
              shadowColor: colors.ink900,
              shadowOffset: { width: 0, height: -1 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
            },
            android: { elevation: 8 },
            default: {},
          }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Home} color={tabColor(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Search} color={tabColor(color)} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Heart} color={tabColor(color)} focused={focused} filled />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={User} color={tabColor(color)} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
