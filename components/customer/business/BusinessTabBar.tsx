import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { BusinessDetailTab } from "../../../src/stores/businessDetailStore";

const TABS: { key: BusinessDetailTab; label: string }[] = [
  { key: "about", label: "About" },
  { key: "products", label: "Products" },
  { key: "reviews", label: "Reviews" },
];

type Props = {
  active: BusinessDetailTab;
  onChange: (tab: BusinessDetailTab) => void;
  productCount?: number;
  reviewCount?: number;
};

function tabLabel(key: BusinessDetailTab, base: string, productCount?: number, reviewCount?: number) {
  if (key === "products" && productCount != null && productCount > 0) return `${base} · ${productCount}`;
  if (key === "reviews" && reviewCount != null && reviewCount > 0) return `${base} · ${reviewCount}`;
  return base;
}

export const BusinessTabBar = memo(function BusinessTabBar({
  active,
  onChange,
  productCount,
  reviewCount,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.segment}>
        {TABS.map((tab) => {
          const selected = tab.key === active;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.75}
              onPress={() => onChange(tab.key)}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected }}
              style={[styles.tab, selected ? styles.tabSelected : null]}
            >
              <Text
                style={[styles.tabText, selected ? styles.tabTextSelected : null]}
                numberOfLines={1}
              >
                {tabLabel(tab.key, tab.label, productCount, reviewCount)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.hint}>Swipe left or right to switch sections</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  tabSelected: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextSelected: {
    color: "#1D4ED8",
  },
  hint: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 11,
    color: "#94A3B8",
  },
});
