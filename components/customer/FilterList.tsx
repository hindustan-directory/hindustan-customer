import type { LucideIcon } from "lucide-react-native";
import { Check, ChevronDown } from "lucide-react-native";
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { accentFor } from "./accent";

export type SelectOption = {
  key: string;
  label: string;
  description?: string;
  accentKey: string;
};

export function FilterSelectField({
  label,
  value,
  accentKey,
  icon: Icon,
  onPress,
  compact = false,
}: {
  label: string;
  value: string;
  accentKey: string;
  icon: LucideIcon;
  onPress: () => void;
  compact?: boolean;
}) {
  const accent = accentFor(accentKey);

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        className="flex-row items-center gap-1.5 rounded-xl border border-ink-100 bg-white px-2.5 py-2 active:bg-ink-50"
      >
        <Icon size={14} color={accent.icon} strokeWidth={2.25} />
        <View className="min-w-0 flex-1">
          <Text className="text-[10px] font-medium text-ink-500">{label}</Text>
          <Text className="text-xs font-semibold text-ink-900" numberOfLines={1}>
            {value}
          </Text>
        </View>
        <ChevronDown size={14} color="#94A3B8" strokeWidth={2} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-2.5 px-3 py-2.5 active:bg-ink-50"
    >
      <View className={`h-8 w-8 items-center justify-center rounded-lg ${accent.iconWrap}`}>
        <Icon size={15} color={accent.icon} strokeWidth={2.25} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[11px] font-medium text-ink-500">{label}</Text>
        <Text className="text-sm font-semibold text-ink-900" numberOfLines={1}>
          {value}
        </Text>
      </View>
      <ChevronDown size={16} color="#94A3B8" strokeWidth={2} />
    </Pressable>
  );
}

export function SelectSheet({
  visible,
  title,
  options,
  selectedKey,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selectedKey: string;
  icon?: LucideIcon;
  onClose: () => void;
  onSelect: (key: string) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="flex-1" accessibilityLabel="Close" onPress={onClose} />
        <View className="max-h-[60%] rounded-t-2xl bg-white pb-6 pt-3">
          <View className="mb-2 flex-row items-center justify-between px-4">
            <Text className="text-base font-bold text-ink-900">{title}</Text>
            <Pressable onPress={onClose} className="px-2 py-1">
              <Text className="text-sm font-semibold text-brand-600">Done</Text>
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mx-4 overflow-hidden rounded-xl border border-ink-100">
              {options.map((option, index) => {
                const selected = selectedKey === option.key;
                return (
                  <View key={option.key}>
                    {index > 0 ? <FilterDivider /> : null}
                    <Pressable
                      onPress={() => {
                        onSelect(option.key);
                        onClose();
                      }}
                      className={`flex-row items-center justify-between px-3 py-2.5 active:bg-ink-50 ${
                        selected ? "bg-brand-50/60" : ""
                      }`}
                    >
                      <Text
                        className={`flex-1 text-sm ${
                          selected ? "font-semibold text-brand-700" : "font-medium text-ink-900"
                        }`}
                        numberOfLines={1}
                      >
                        {option.label}
                      </Text>
                      {selected ? <Check size={16} color="#2563EB" strokeWidth={2.5} /> : null}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function FilterListCard({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <View className="mb-2">
      {title ? (
        <Text className="mb-1.5 px-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
          {title}
        </Text>
      ) : null}
      <View className="overflow-hidden rounded-xl border border-ink-100 bg-white">
        {children}
      </View>
    </View>
  );
}

export function FilterDivider() {
  return <View className="border-t border-ink-100" />;
}
