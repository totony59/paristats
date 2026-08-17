import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { DashboardStats } from "@paristats/shared";
import type { TabScreenProps } from "../navigation/types";
import { fetchDashboard } from "../api/client";
import { StatCard } from "../components/StatCard";
import { formatCurrency, formatPercent } from "../utils/format";
import logoWordmark from "../../assets/logo-wordmark.png";

type Props = TabScreenProps<"Home">;

export function HomeScreen({ navigation }: Props) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard()
        .then((d) => {
          setStats(d);
          setStatsError(null);
        })
        .catch((err) => setStatsError(err instanceof Error ? err.message : "Erreur inconnue."));
    }, []),
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Image source={logoWordmark} style={styles.logo} resizeMode="contain" />
        <Text style={styles.subtitle}>Suivi et analyse de tes paris sportifs</Text>
        <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate("Scanner")}>
          <Text style={styles.scanButtonText}>📷 Scanner un pari</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vue d'ensemble</Text>
        {statsError && <Text style={styles.errorText}>{statsError}</Text>}
        {!stats && !statsError && <ActivityIndicator color="#6366f1" />}
        {stats && (
          <View style={styles.statsRow}>
            <StatCard label="Bankroll" value={formatCurrency(stats.bankroll)} />
            <StatCard
              label="Bénéfice net"
              value={formatCurrency(stats.netProfit)}
              tone={stats.netProfit >= 0 ? "profit" : "loss"}
            />
            <StatCard label="ROI" value={formatPercent(stats.roi)} tone={stats.roi >= 0 ? "profit" : "loss"} />
            <StatCard label="Nombre de paris" value={String(stats.totalBets)} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 20,
    backgroundColor: "#0f1420",
  },
  hero: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 24,
  },
  logo: {
    width: 260,
    height: 130,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 14,
  },
  scanButton: {
    marginTop: 16,
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  scanButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
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
  errorText: {
    color: "#ef4444",
    fontSize: 13,
  },
});
