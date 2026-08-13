import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  children: ReactNode;
  className?: string;
  contentContainerClassName?: string;
  /** Auth screens without a nav header. */
  safeTop?: boolean;
  /** Stack screens with `headerShown: true`. Kept for call-site compat. */
  withHeader?: boolean;
  /**
   * Bottom sheet inside a Modal. Android window resize often skips Modals —
   * wrap with KeyboardAvoidingView (height) and leave enableOnAndroid off
   * (same pattern as milk-remote EditEntryModal).
   */
  sheet?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Unused with KeyboardAwareScrollView; kept so existing call sites typecheck. */
  keyboardVerticalOffset?: number;
};

export function KeyboardForm({
  children,
  className,
  contentContainerClassName,
  safeTop = false,
  withHeader: _withHeader = false,
  sheet = false,
  style,
}: Props) {
  const insets = useSafeAreaInsets();
  const bottomPad = sheet
    ? Math.max(insets.bottom, 16)
    : Math.max(insets.bottom, 24);

  const scroll = (
    <KeyboardAwareScrollView
      className={sheet ? undefined : className ?? "flex-1 bg-white"}
      style={
        sheet
          ? { flex: 1 }
          : [{ flex: 1 }, safeTop ? { paddingTop: insets.top + 12 } : null, style]
      }
      contentContainerClassName={
        contentContainerClassName ??
        (sheet ? "flex-grow justify-end" : "px-6 pb-8")
      }
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: bottomPad + (sheet ? 0 : 40),
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      // Screens: enable Android (CustomerFormScreen). Sheets: off (EditEntryModal).
      enableOnAndroid={!sheet}
      enableAutomaticScroll
      extraScrollHeight={sheet ? 12 : 100}
      extraHeight={sheet ? 0 : Platform.OS === "ios" ? 160 : 120}
      bounces={!sheet}
    >
      {children}
    </KeyboardAwareScrollView>
  );

  if (!sheet) return scroll;

  return (
    <KeyboardAvoidingView
      className={className ?? "flex-1 justify-end bg-black/40"}
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {scroll}
    </KeyboardAvoidingView>
  );
}
