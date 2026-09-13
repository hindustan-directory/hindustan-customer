import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, FLOATING_TAB_BAR, floatingTabBarBottom } from "./chrome";

const ICON_SIZE = 24;
/** Horizontal/vertical gap between the sliding highlight and each tab slot's edges. */
const PILL_INSET = 8;

/**
 * Floating bottom tab bar (Flipkart-style): a rounded white pill that floats
 * above the content, with a single highlight that SLIDES between tabs and wraps
 * the active tab's icon AND label. Active = brand blue; inactive = dark ink900.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [rowWidth, setRowWidth] = useState(0);
  const count = state.routes.length;
  const slot = count > 0 ? rowWidth / count : 0;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * slot,
      useNativeDriver: true,
      stiffness: 200,
      damping: 22,
      mass: 0.8,
    }).start();
  }, [state.index, slot, translateX]);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: FLOATING_TAB_BAR.sideMargin,
        right: FLOATING_TAB_BAR.sideMargin,
        bottom: floatingTabBarBottom(insets.bottom),
      }}
    >
      {/* Shadow layer — no overflow so the shadow is visible. */}
      <View
        style={{
          height: FLOATING_TAB_BAR.height,
          borderRadius: FLOATING_TAB_BAR.radius,
          backgroundColor: colors.white,
          ...Platform.select({
            ios: {
              shadowColor: colors.ink900,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
            },
            android: { elevation: 16 },
            default: {},
          }),
        }}
      >
        {/* Clipped inner content so the sliding highlight stays inside the pill. */}
        <View
          onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
          style={{
            flex: 1,
            flexDirection: "row",
            borderRadius: FLOATING_TAB_BAR.radius,
            overflow: "hidden",
          }}
        >
          {slot > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: PILL_INSET,
                bottom: PILL_INSET,
                left: PILL_INSET / 2,
                width: slot - PILL_INSET,
                borderRadius: FLOATING_TAB_BAR.radius - PILL_INSET,
                backgroundColor: colors.brand50,
                transform: [{ translateX }],
              }}
            />
          ) : null}

          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const { options } = descriptors[route.key];
            const color = focused ? colors.brand600 : colors.ink900;
            const label =
              typeof options.tabBarLabel === "string"
                ? options.tabBarLabel
                : (options.title ?? route.name);
            const icon = options.tabBarIcon?.({ focused, color, size: ICON_SIZE });

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={label}
                onPress={onPress}
                style={{ flex: 1, alignItems: "center", justifyContent: "center", rowGap: 2 }}
              >
                {icon}
                <Text
                  allowFontScaling={false}
                  style={{ color, fontSize: 10, fontWeight: "700", lineHeight: 12 }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
