import { StyleSheet, Text, View } from "react-native";
import type { BetStatus } from "@paristats/shared";

const STATUS_CONFIG: Record<BetStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "En attente", color: "#f59e0b", bg: "#f59e0b26" },
  won: { label: "Gagné", color: "#22c55e", bg: "#22c55e26" },
  lost: { label: "Perdu", color: "#ef4444", bg: "#ef444426" },
  void: { label: "Annulé", color: "#94a3b8", bg: "#94a3b826" },
};

export function StatusBadge({ status }: { status: BetStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
