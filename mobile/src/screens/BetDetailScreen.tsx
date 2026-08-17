import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Bet } from "@paristats/shared";
import type { RootStackScreenProps } from "../navigation/types";
import { buildScreenshotUrl, fetchBetById } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { formatCurrency, formatDate } from "../utils/format";

type Props = RootStackScreenProps<"BetDetail">;

export function BetDetailScreen({ route }: Props) {
  const { betId } = route.params;
  const [bet, setBet] = useState<Bet | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchBetById(betId)
      .then(async (b) => {
        if (cancelled) return;
        setBet(b);
        if (b.screenshotPath) {
          setImageUrl(await buildScreenshotUrl(b.screenshotPath));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur inconnue.");
      });
    return () => {
      cancelled = true;
    };
  }, [betId]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!bet) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />}

      <View style={styles.headerRow}>
        <Text style={styles.title}>{bet.competition ?? bet.bookmaker ?? "Pari"}</Text>
        <StatusBadge status={bet.status} />
      </View>

      <View style={styles.grid}>
        <InfoTile label="Date" value={formatDate(bet.date)} />
        <InfoTile label="Heure" value={bet.time ?? "—"} />
        <InfoTile label="Bookmaker" value={bet.bookmaker ?? "—"} />
        <InfoTile label="Type" value={bet.betType === "combine" ? "Combiné" : bet.betType === "simple" ? "Simple" : "—"} />
        <InfoTile label="Mise" value={formatCurrency(bet.stake)} />
        <InfoTile label="Cote totale" value={bet.totalOdds != null ? bet.totalOdds.toFixed(2) : "—"} />
        <InfoTile label="Gain potentiel" value={formatCurrency(bet.potentialWin)} />
        <InfoTile label="Retour" value={bet.totalReturn != null ? formatCurrency(bet.totalReturn) : "—"} />
        <InfoTile
          label="Bénéfice"
          value={bet.actualProfit != null ? formatCurrency(bet.actualProfit) : "—"}
          tone={bet.actualProfit != null ? (bet.actualProfit >= 0 ? "profit" : "loss") : "neutral"}
        />
      </View>

      <Text style={styles.sectionTitle}>Sélections</Text>
      {bet.selections.length === 0 && <Text style={styles.empty}>Aucune sélection.</Text>}
      {bet.selections.map((selection) => (
        <View key={selection.id} style={styles.selectionCard}>
          <Text style={styles.selectionMatch}>{selection.match ?? "Match non renseigné"}</Text>
          <View style={styles.selectionRow}>
            <Text style={styles.selectionMeta}>{selection.market ?? "—"}</Text>
            <Text style={styles.selectionOdds}>{selection.odds != null ? selection.odds.toFixed(2) : "—"}</Text>
          </View>
          {selection.selection && <Text style={styles.selectionPick}>{selection.selection}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

function InfoTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "profit" | "loss";
}) {
  const color = tone === "profit" ? "#22c55e" : tone === "loss" ? "#ef4444" : "#f1f5f9";
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
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
  image: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    backgroundColor: "#000",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "#f1f5f9",
    fontSize: 18,
    fontWeight: "800",
    flexShrink: 1,
    marginRight: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#232b3d",
    backgroundColor: "#161d2e",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  tileLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  tileValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#f1f5f9",
    fontSize: 15,
    fontWeight: "700",
  },
  empty: {
    color: "#64748b",
    fontSize: 13,
  },
  selectionCard: {
    borderWidth: 1,
    borderColor: "#232b3d",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  selectionMatch: {
    color: "#f1f5f9",
    fontWeight: "700",
    fontSize: 14,
  },
  selectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  selectionMeta: {
    color: "#94a3b8",
    fontSize: 12,
  },
  selectionOdds: {
    color: "#818cf8",
    fontWeight: "700",
    fontSize: 12,
  },
  selectionPick: {
    color: "#cbd5e1",
    fontSize: 12,
  },
});
