import { StyleSheet, Text, View } from "react-native";

interface StatCardProps {
  label: string;
  value: string;
  tone?: "neutral" | "profit" | "loss";
}

export function StatCard({ label, value, tone = "neutral" }: StatCardProps) {
  const color = tone === "profit" ? "#22c55e" : tone === "loss" ? "#ef4444" : "#f1f5f9";
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#232b3d",
    backgroundColor: "#161d2e",
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  label: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 20,
    fontWeight: "800",
  },
});
