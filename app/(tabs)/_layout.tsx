import { Tabs } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { Heart, Home, Search, User } from "lucide-react-native";
import type { ColorValue } from "react-native";

import { FloatingTabBar } from "../../src/navigation/FloatingTabBar";

function TabBarIcon({
  icon: Icon,
  color,
  focused,
}: {
  icon: LucideIcon;
  color: ColorValue;
  focused: boolean;
}) {
  const tint = typeof color === "string" ? color : "#0F172A";
  return <Icon size={24} color={tint} strokeWidth={focused ? 2.5 : 2} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // "shift" animates the tab swap on the JS thread and feels laggy with
        // heavy screens; "none" makes tab switches instant.
        animation: "none",
        // Stop blurred tabs from re-rendering so switching stays snappy.
        freezeOnBlur: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Home} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Search} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={Heart} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon icon={User} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
