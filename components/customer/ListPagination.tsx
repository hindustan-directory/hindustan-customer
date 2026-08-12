import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function ListPagination({ page, totalPages, total, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <View className="flex-row items-center justify-between border-t border-ink-100 bg-white px-5 py-3">
      <Pressable
        accessibilityRole="button"
        disabled={page <= 1}
        onPress={() => onPageChange(page - 1)}
        className={`flex-row items-center gap-1 rounded-lg px-2 py-1 ${page <= 1 ? "opacity-40" : "active:bg-ink-50"}`}
      >
        <ChevronLeft size={18} color="#64748B" strokeWidth={2} />
        <Text className="text-sm text-ink-600">Previous</Text>
      </Pressable>
      <Text className="text-sm text-ink-500">
        Page {page} of {totalPages} · {total} total
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={page >= totalPages}
        onPress={() => onPageChange(page + 1)}
        className={`flex-row items-center gap-1 rounded-lg px-2 py-1 ${page >= totalPages ? "opacity-40" : "active:bg-ink-50"}`}
      >
        <Text className="text-sm text-ink-600">Next</Text>
        <ChevronRight size={18} color="#64748B" strokeWidth={2} />
      </Pressable>
    </View>
  );
}
