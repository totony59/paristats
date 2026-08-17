import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { Bet } from "@paristats/shared";
import type { TabScreenProps } from "../navigation/types";
import { fetchBets } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { formatCurrency, formatDate } from "../utils/format";

type Props = TabScreenProps<"MesParis">;

export function MesParisScreen({ navigation }: Props) {
  const [bets, setBets] = useState<Bet[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  function renderItem({ item }: { item: Bet }) {
    const title = item.competition ?? item.bookmaker ?? "Pari";
    const subtitle =
      item.selections.length === 1
        ? (item.selections[0].match ?? "Sélection unique")
        : `${item.selections.length} sélections`;

    return (
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
              item.actualProfit != null && item.actualProfit >= 0 ? styles.profitPositive : styles.profitNegative,
            ]}
          >
            {item.actualProfit != null ? formatCurrency(item.actualProfit) : formatCurrency(item.stake)}
          </Text>
        </View>
      </TouchableOpacity>
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#161d2e",
    borderWidth: 1,
    borderColor: "#232b3d",
    borderRadius: 12,
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
});
