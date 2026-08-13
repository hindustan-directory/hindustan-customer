import { Heart } from "lucide-react-native";
import { memo } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../ui";

type Props = {
  isSaved: boolean;
  favBusy: boolean;
  onEnquire: () => void;
  onBook: () => void;
  onToggleFavourite: () => void;
};

export const BusinessDetailActions = memo(function BusinessDetailActions({
  isSaved,
  favBusy,
  onEnquire,
  onBook,
  onToggleFavourite,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.row}>
        <Button label="Enquire" className="min-w-0 flex-1 py-3.5" onPress={onEnquire} />
        <Button
          label="Book"
          variant="secondary"
          className="min-w-0 flex-1 py-3.5"
          onPress={onBook}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isSaved ? "Remove from saved" : "Save business"}
          activeOpacity={0.75}
          disabled={favBusy}
          onPress={onToggleFavourite}
          style={[
            styles.saveBtn,
            isSaved ? styles.saveBtnActive : null,
            favBusy ? styles.saveBtnBusy : null,
          ]}
        >
          {favBusy ? (
            <ActivityIndicator color="#2563EB" />
          ) : (
            <Heart
              size={22}
              color={isSaved ? "#2563EB" : "#64748B"}
              fill={isSaved ? "#2563EB" : "transparent"}
              strokeWidth={2.25}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveBtn: {
    height: 50,
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  saveBtnActive: {
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
  },
  saveBtnBusy: {
    opacity: 0.5,
  },
});
