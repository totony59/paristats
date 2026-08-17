import { useCallback, useState } from "react";
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
import type { BankrollOverview, TransactionType } from "@paristats/shared";
import type { TabScreenProps } from "../navigation/types";
import { createBankrollTransaction, fetchBankroll } from "../api/client";
import { StatCard } from "../components/StatCard";
import { BankrollChart } from "../components/BankrollChart";
import { formatCurrency, formatDate } from "../utils/format";

type Props = TabScreenProps<"Bankroll">;

export function BankrollScreen(_props: Props) {
  const [overview, setOverview] = useState<BankrollOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<TransactionType>("deposit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchBankroll();
      setOverview(data);
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

  async function handleAdd() {
    const parsed = Number(amount.replace(",", "."));
    if (!amount.trim() || Number.isNaN(parsed) || parsed <= 0) {
      setFormError("Montant invalide.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await createBankrollTransaction({ type, amount: parsed, note: note.trim() || null });
      setAmount("");
      setNote("");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  }

  if (!overview && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  }

  if (error || !overview) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.statsRow}>
        <StatCard label="Solde" value={formatCurrency(overview.balance)} />
        <StatCard label="Bénéfice net" value={formatCurrency(overview.netProfit)} tone={overview.netProfit >= 0 ? "profit" : "loss"} />
        <StatCard label="Dépôts" value={formatCurrency(overview.totalDeposits)} />
        <StatCard label="Retraits" value={formatCurrency(overview.totalWithdrawals)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Évolution de la bankroll</Text>
        <BankrollChart data={overview.history} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ajouter un dépôt / retrait</Text>
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, type === "deposit" && styles.chipActive]}
            onPress={() => setType("deposit")}
          >
            <Text style={[styles.chipText, type === "deposit" && styles.chipTextActive]}>Dépôt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, type === "withdrawal" && styles.chipActive]}
            onPress={() => setType("withdrawal")}
          >
            <Text style={[styles.chipText, type === "withdrawal" && styles.chipTextActive]}>Retrait</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Montant (€)"
          placeholderTextColor="#64748b"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Note (optionnel)"
          placeholderTextColor="#64748b"
          value={note}
          onChangeText={setNote}
        />
        {formError && <Text style={styles.errorText}>{formError}</Text>}
        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleAdd}
          disabled={saving}
        >
          <Text style={styles.submitButtonText}>{saving ? "Ajout…" : "Ajouter"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Historique des transactions</Text>
        {overview.transactions.length === 0 && (
          <Text style={styles.empty}>Aucune transaction pour l'instant.</Text>
        )}
        {overview.transactions.map((t) => (
          <View key={t.id} style={styles.transactionRow}>
            <View>
              <Text style={styles.transactionType}>{t.type === "deposit" ? "Dépôt" : "Retrait"}</Text>
              <Text style={styles.transactionDate}>{formatDate(t.date)}</Text>
              {t.note && <Text style={styles.transactionNote}>{t.note}</Text>}
            </View>
            <Text style={[styles.transactionAmount, t.type === "deposit" ? styles.profitPositive : styles.profitNegative]}>
              {t.type === "deposit" ? "+" : "-"}
              {formatCurrency(t.amount)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
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
    fontSize: 13,
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
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#232b3d",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  chipText: {
    color: "#cbd5e1",
    fontWeight: "600",
    fontSize: 13,
  },
  chipTextActive: {
    color: "#fff",
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
  submitButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  empty: {
    color: "#64748b",
    fontSize: 13,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#232b3d",
  },
  transactionType: {
    color: "#f1f5f9",
    fontWeight: "600",
    fontSize: 13,
  },
  transactionDate: {
    color: "#64748b",
    fontSize: 11,
  },
  transactionNote: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 2,
  },
  transactionAmount: {
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
