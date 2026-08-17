import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { DashboardStats } from "@paristats/shared";
import type { TabScreenProps } from "../navigation/types";
import { DEFAULT_API_URL, getApiUrl, resetApiUrl, setApiUrl, testConnection } from "../config/apiConfig";
import { fetchDashboard } from "../api/client";
import { StatCard } from "../components/StatCard";
import { formatCurrency, formatPercent } from "../utils/format";

type Props = TabScreenProps<"Home">;

export function HomeScreen({ navigation }: Props) {
  const [apiUrl, setApiUrlState] = useState(DEFAULT_API_URL);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    getApiUrl().then(setApiUrlState);
  }, []);

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

  async function handleSaveUrl() {
    await setApiUrl(apiUrl);
    setTestResult(null);
  }

  async function handleResetUrl() {
    await resetApiUrl();
    setApiUrlState(DEFAULT_API_URL);
    setTestResult(null);
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(apiUrl);
    setTestResult(result);
    setTesting(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.appName}>PariStats</Text>
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Connexion backend</Text>
        <Text style={styles.cardHint}>
          Adresse du serveur PariStats. Par défaut, le backend hébergé — inutile d'y toucher sauf
          pour du développement local.
        </Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrlState}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://paristats-backend.onrender.com"
          placeholderTextColor="#64748b"
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveUrl}>
            <Text style={styles.secondaryButtonText}>Enregistrer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleTestConnection} disabled={testing}>
            {testing ? (
              <ActivityIndicator color="#818cf8" />
            ) : (
              <Text style={styles.secondaryButtonText}>Tester la connexion</Text>
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleResetUrl}>
          <Text style={styles.resetLink}>Réinitialiser à l'adresse par défaut</Text>
        </TouchableOpacity>
        {testResult && (
          <Text style={[styles.testResult, { color: testResult.ok ? "#22c55e" : "#ef4444" }]}>
            {testResult.ok ? "✅ " : "❌ "}
            {testResult.message}
          </Text>
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
  appName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#f1f5f9",
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
  cardHint: {
    color: "#64748b",
    fontSize: 12,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: "#232b3d",
    backgroundColor: "#0f1420",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f1f5f9",
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#232b3d",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#cbd5e1",
    fontWeight: "600",
    fontSize: 13,
  },
  testResult: {
    fontSize: 13,
    fontWeight: "600",
  },
  resetLink: {
    color: "#818cf8",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
