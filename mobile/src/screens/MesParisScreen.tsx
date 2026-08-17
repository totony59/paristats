import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { Bet } from "@paristats/shared";
import type { TabScreenProps } from "../navigation/types";
import { fetchBets, updateBetOutcome } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { formatCurrency, formatDate } from "../utils/format";

type Props = TabScreenProps<"MesParis">;

export function MesParisScreen({ navigation }: Props) {
  const [bets, setBets] = useState<Bet[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchBets();
      setBets(data);
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

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleMarkOutcome(bet: Bet, status: "won" | "lost") {
    setUpdatingId(bet.id);
    try {
      // "Gagné" sans autre précision : on prend le gain potentiel calculé à l'analyse
      // comme retour réel (cas standard, pas de cash-out partiel). Corrigeable dans le
      // détail du pari si le montant réel diffère.
      await updateBetOutcome(bet.id, {
        status,
        totalReturn: status === "won" ? bet.potentialWin : null,
      });
      await load();
    } catch (err) {
      Alert.alert("Erreur", err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setUpdatingId(null);
    }
  }

  function renderItem({ item }: { item: Bet }) {
    const title = item.competition ?? item.bookmaker ?? "Pari";
    const subtitle =
      item.selections.length === 1
        ? (item.selections[0].match ?? "Sélection unique")
        : `${item.selections.length} sélections`;
    const isUpdating = updatingId === item.id;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate("BetDetail", { betId: item.id })}
        >
          <View style={styles.rowMain}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.rowSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
            <Text style={styles.rowDate}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.rowEnd}>
            <StatusBadge status={item.status} />
            <Text
              style={[
                styles.profit,
                item.actualProfit != null && item.actualProfit >= 0
                  ? styles.profitPositive
                  : styles.profitNegative,
              ]}
            >
              {item.actualProfit != null ? formatCurrency(item.actualProfit) : formatCurrency(item.stake)}
            </Text>
          </View>
        </TouchableOpacity>

        {item.status === "pending" && (
          <View style={styles.outcomeRow}>
            {isUpdating ? (
              <ActivityIndicator color="#6366f1" style={styles.outcomeLoader} />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.outcomeButton, styles.wonButton]}
                  onPress={() => handleMarkOutcome(item, "won")}
                >
                  <Text style={styles.wonButtonText}>✅ Gagné</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.outcomeButton, styles.lostButton]}
                  onPress={() => handleMarkOutcome(item, "lost")}
                >
                  <Text style={styles.lostButtonText}>❌ Perdu</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  }

  if (!bets && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={bets}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>Aucun pari enregistré pour l'instant.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: "#0f1420",
  },
  listContent: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
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
  emptyText: {
    color: "#64748b",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#161d2e",
    borderWidth: 1,
    borderColor: "#232b3d",
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  rowMain: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: "#f1f5f9",
    fontWeight: "700",
    fontSize: 15,
  },
  rowSubtitle: {
    color: "#94a3b8",
    fontSize: 12,
  },
  rowDate: {
    color: "#64748b",
    fontSize: 11,
  },
  rowEnd: {
    alignItems: "flex-end",
    gap: 6,
  },
  profit: {
    fontWeight: "700",
    fontSize: 13,
  },
  profitPositive: {
    color: "#22c55e",
  },
  profitNegative: {
    color: "#ef4444",
  },
  outcomeRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#232b3d",
  },
  outcomeLoader: {
    flex: 1,
    paddingVertical: 10,
  },
  outcomeButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  wonButton: {
    backgroundColor: "#22c55e1a",
    borderRightWidth: 1,
    borderRightColor: "#232b3d",
  },
  lostButton: {
    backgroundColor: "#ef44441a",
  },
  wonButtonText: {
    color: "#22c55e",
    fontWeight: "700",
    fontSize: 13,
  },
  lostButtonText: {
    color: "#ef4444",
    fontWeight: "700",
    fontSize: 13,
  },
});
