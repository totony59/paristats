import { StyleSheet, Text, View } from "react-native";

interface ConfidenceBadgeProps {
  confidence: number;
  hasValue: boolean;
}

export function ConfidenceBadge({ confidence, hasValue }: ConfidenceBadgeProps) {
  const level = !hasValue
    ? { emoji: "🔴", label: "À vérifier", color: "#ef4444", bg: "#fee2e2" }
    : confidence >= 0.9
      ? { emoji: "🟢", label: "Confiance élevée", color: "#16a34a", bg: "#dcfce7" }
      : confidence >= 0.7
        ? { emoji: "🟠", label: "Vérification recommandée", color: "#d97706", bg: "#fef3c7" }
        : { emoji: "🔴", label: "Vérification nécessaire", color: "#ef4444", bg: "#fee2e2" };

  return (
    <View style={[styles.badge, { backgroundColor: level.bg }]}>
      <Text style={[styles.text, { color: level.color }]}>
        {level.emoji} {level.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
  },
});
