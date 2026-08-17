import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import type { StatsBreakdown, StatsOverview } from "@paristats/shared";
import type { TabScreenProps } from "../navigation/types";
import { fetchStats } from "../api/client";
import { StatCard } from "../components/StatCard";
import { formatCurrency, formatPercent } from "../utils/format";

type Props = TabScreenProps<"Statistiques">;

export function StatistiquesScreen(_props: Props) {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setStats(await fetchStats());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!stats && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  if (error || !stats) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.statsRow}>
        <StatCard
          label="Bénéfice net"
          value={formatCurrency(stats.global.netProfit)}
          tone={stats.global.netProfit >= 0 ? "profit" : "loss"}
        />
        <StatCard label="ROI" value={formatPercent(stats.global.roi)} tone={stats.global.roi >= 0 ? "profit" : "loss"} />
        <StatCard label="Taux de réussite" value={formatPercent(stats.global.successRate)} />
        <StatCard label="Cote moyenne" value={stats.global.averageOdds.toFixed(2)} />
        <StatCard label="Mise moyenne" value={formatCurrency(stats.global.averageStake)} />
        <StatCard label="Gain moyen" value={formatCurrency(stats.global.averageWin)} tone="profit" />
        <StatCard label="Perte moyenne" value={formatCurrency(stats.global.averageLoss)} tone="loss" />
      </View>

      <BreakdownSection title="Par type de pari" items={stats.byBetType} />
      <BreakdownSection title="Par compétition" items={stats.byCompetition} />
    </ScrollView>
  );
}

function BreakdownSection({ title, items }: { title: string; items: StatsBreakdown[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {items.length === 0 && <Text style={styles.empty}>Pas assez de données.</Text>}
      {items.map((item) => (
        <View key={item.key} style={styles.breakdownRow}>
          <View style={styles.breakdownMain}>
            <Text style={styles.breakdownLabel}>{item.label}</Text>
            <Text style={styles.breakdownMeta}>
              {item.totalBets} pari{item.totalBets > 1 ? "s" : ""} · {formatPercent(item.successRate)} réussite ·
              cote moy. {item.averageOdds.toFixed(2)}
            </Text>
          </View>
          <View style={styles.breakdownEnd}>
            <Text style={[styles.breakdownProfit, item.netProfit >= 0 ? styles.positive : styles.negative]}>
              {formatCurrency(item.netProfit)}
            </Text>
            <Text style={[styles.breakdownRoi, item.roi >= 0 ? styles.positive : styles.negative]}>
              ROI {formatPercent(item.roi)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 16,
    backgroundColor: "#0f1420",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f1420",
    padding: 24,
  },
  errorText: {
    color: "#ef4444",
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: "#232b3d",
    backgroundColor: "#161d2e",
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    color: "#f1f5f9",
    fontWeight: "700",
    fontSize: 15,
  },
  empty: {
    color: "#64748b",
    fontSize: 13,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#232b3d",
    gap: 8,
  },
  breakdownMain: {
    flex: 1,
    gap: 3,
  },
  breakdownLabel: {
    color: "#f1f5f9",
    fontWeight: "600",
    fontSize: 14,
  },
  breakdownMeta: {
    color: "#94a3b8",
    fontSize: 11,
  },
  breakdownEnd: {
    alignItems: "flex-end",
    gap: 2,
  },
  breakdownProfit: {
    fontWeight: "700",
    fontSize: 14,
  },
  breakdownRoi: {
    fontSize: 11,
    fontWeight: "600",
  },
  positive: {
    color: "#22c55e",
  },
  negative: {
    color: "#ef4444",
  },
});
