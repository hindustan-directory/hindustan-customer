import { useEffect, useState, type ReactNode } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function SheetModal({ visible, title, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  // A RN Modal is its own window on Android, so windowSoftInputMode="adjustResize"
  // never resizes it and KeyboardAvoidingView gets no inset — the keyboard covers
  // the sheet. Track the keyboard height ourselves and pad the sheet up by it.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0);
      return;
    }
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvt, (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const sheetPadBottom =
    keyboardHeight > 0 ? keyboardHeight + 12 : Math.max(insets.bottom, 16);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/50"
          accessibilityLabel="Close"
          onPress={onClose}
        />
        <View
          className="rounded-t-2xl bg-white px-5 pt-3"
          style={{ paddingBottom: sheetPadBottom }}
        >
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-ink-200" />
          <Text className="mb-4 text-lg font-bold text-ink-900">{title}</Text>
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            nestedScrollEnabled
            // The sheet itself is lifted above the keyboard via paddingBottom;
            // this scroll view only keeps tall content reachable. Its own
            // keyboard handling stays off so the two don't fight.
            enableOnAndroid={false}
            enableAutomaticScroll={false}
          >
            {children}
          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
}
