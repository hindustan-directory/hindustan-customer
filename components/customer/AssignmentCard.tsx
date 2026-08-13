import { UserRoundPen } from "lucide-react-native";
import { Text, View } from "react-native";
import { Card, IconActionButton } from "../ui";

type Props = {
  title?: string;
  assigneeName?: string | null;
  canChange: boolean;
  busy?: boolean;
  onChangePress: () => void;
  className?: string;
  titleInCard?: boolean;
};

function SectionLabel({ children, className = "" }: { children: string; className?: string }) {
  return (
    <Text className={`text-xs font-bold uppercase tracking-wider text-ink-500 ${className}`}>
      {children}
    </Text>
  );
}

export function AssignmentCard({
  title = "Assignment",
  assigneeName,
  canChange,
  busy,
  onChangePress,
  className = "",
  titleInCard = false,
}: Props) {
  const row = (
    <View className="flex-row items-center gap-2">
      <Text className="min-w-0 flex-1 text-sm font-semibold text-ink-800">
        {assigneeName ?? "Unassigned"}
      </Text>
      {canChange ? (
        <IconActionButton
          icon={UserRoundPen}
          accessibilityLabel="Change assignment"
          disabled={busy}
          onPress={onChangePress}
        />
      ) : null}
    </View>
  );

  if (titleInCard) {
    return (
      <Card className={`px-4 py-3.5 ${className}`}>
        <SectionLabel className="mb-3">{title}</SectionLabel>
        {row}
      </Card>
    );
  }

  return (
    <>
      <SectionLabel className="mb-2 mt-6">{title}</SectionLabel>
      <Card className={`px-4 py-3.5 ${className}`}>{row}</Card>
    </>
  );
}
