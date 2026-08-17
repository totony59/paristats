import { useState, type ReactNode } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BetStatus, BetType } from "@paristats/shared";
import type { RootStackParamList } from "../navigation/types";
import { createBet } from "../api/client";
import { fromAnalysisResult, toCreateBetPayload } from "../types/editableBet";
import type { EditableBet, EditableSelection } from "../types/editableBet";
import { ConfidenceBadge } from "../components/ConfidenceBadge";

type Props = NativeStackScreenProps<RootStackParamList, "Verification">;

const STATUS_OPTIONS: { value: BetStatus; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "won", label: "Gagné" },
  { value: "lost", label: "Perdu" },
  { value: "void", label: "Annulé" },
];

const BET_TYPE_OPTIONS: { value: BetType; label: string }[] = [
  { value: "simple", label: "Simple" },
  { value: "combine", label: "Combiné" },
];

export function VerificationScreen({ route, navigation }: Props) {
  const { analysis, image } = route.params;
  const [initial] = useState(() => fromAnalysisResult(analysis.result));
  const [form, setForm] = useState<EditableBet>(initial.form);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof EditableBet>(key: K, value: EditableBet[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setSelection(index: number, patch: Partial<EditableSelection>) {
    setForm((prev) => ({
      ...prev,
      selections: prev.selections.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }

  function removeSelection(index: number) {
    setForm((prev) => ({ ...prev, selections: prev.selections.filter((_, i) => i !== index) }));
  }

  function addSelection() {
    setForm((prev) => ({
      ...prev,
      selections: [
        ...prev.selections,
        {
          match: "",
          market: "",
          selection: "",
          odds: "",
          confidence: { match: 0, market: 0, selection: 0, odds: 0 },
        },
      ],
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await createBet(toCreateBetPayload(form));
      Alert.alert("Pari enregistré", "Les statistiques et la bankroll ont été mises à jour.", [
        { text: "OK", onPress: () => navigation.popToTop() },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  const confidence = initial.confidence;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {analysis.mode === "mock" && (
        <View style={styles.mockBanner}>
          <Text style={styles.mockBannerText}>
            Mode démo — aucune clé ANTHROPIC_API_KEY configurée côté backend. Ces données sont une
            analyse simulée. Vérifie/complète tous les champs avant d'enregistrer.
          </Text>
        </View>
      )}

      <Image source={{ uri: image.uri }} style={styles.image} resizeMode="contain" />

      <Field label="Bookmaker" confidence={confidence.bookmaker} hasValue={form.bookmaker !== ""}>
        <TextInput style={styles.input} value={form.bookmaker} onChangeText={(v) => set("bookmaker", v)} />
      </Field>
      <Field label="Sport" confidence={confidence.sport} hasValue={form.sport !== ""}>
        <TextInput style={styles.input} value={form.sport} onChangeText={(v) => set("sport", v)} />
      </Field>
      <Field label="Date (AAAA-MM-JJ)" confidence={confidence.date} hasValue={form.date !== ""}>
        <TextInput
          style={styles.input}
          value={form.date}
          onChangeText={(v) => set("date", v)}
          placeholder="2026-08-16"
          placeholderTextColor="#64748b"
        />
      </Field>
      <Field label="Heure (HH:MM)" confidence={confidence.time} hasValue={form.time !== ""}>
        <TextInput
          style={styles.input}
          value={form.time}
          onChangeText={(v) => set("time", v)}
          placeholder="20:45"
          placeholderTextColor="#64748b"
        />
      </Field>
      <Field label="Compétition" confidence={confidence.competition} hasValue={form.competition !== ""}>
        <TextInput style={styles.input} value={form.competition} onChangeText={(v) => set("competition", v)} />
      </Field>

      <Field label="Type de pari" confidence={confidence.betType} hasValue={form.betType !== ""}>
        <ChipRow options={BET_TYPE_OPTIONS} value={form.betType} onChange={(v) => set("betType", v)} />
      </Field>

      <Field label="Mise (€)" confidence={confidence.stake} hasValue={form.stake !== ""}>
        <TextInput
          style={styles.input}
          value={form.stake}
          onChangeText={(v) => set("stake", v)}
          keyboardType="decimal-pad"
        />
      </Field>
      <Field label="Cote totale" confidence={confidence.totalOdds} hasValue={form.totalOdds !== ""}>
        <TextInput
          style={styles.input}
          value={form.totalOdds}
          onChangeText={(v) => set("totalOdds", v)}
          keyboardType="decimal-pad"
        />
      </Field>
      <Field
        label="Gain potentiel (€)"
        confidence={confidence.potentialWin}
        hasValue={form.potentialWin !== ""}
      >
        <TextInput
          style={styles.input}
          value={form.potentialWin}
          onChangeText={(v) => set("potentialWin", v)}
          keyboardType="decimal-pad"
        />
      </Field>
      <Field
        label="Retour total (€)"
        confidence={confidence.totalReturn}
        hasValue={form.totalReturn !== ""}
      >
        <TextInput
          style={styles.input}
          value={form.totalReturn}
          onChangeText={(v) => set("totalReturn", v)}
          keyboardType="decimal-pad"
        />
      </Field>

      <Field label="Statut" confidence={confidence.status} hasValue={Boolean(form.status)}>
        <ChipRow options={STATUS_OPTIONS} value={form.status} onChange={(v) => set("status", v)} />
      </Field>

      <Field
        label="Identifiant du pari"
        confidence={confidence.betExternalId}
        hasValue={form.betExternalId !== ""}
      >
        <TextInput
          style={styles.input}
          value={form.betExternalId}
          onChangeText={(v) => set("betExternalId", v)}
        />
      </Field>

      <View style={styles.selectionsHeader}>
        <Text style={styles.sectionTitle}>Sélections</Text>
        <TouchableOpacity onPress={addSelection}>
          <Text style={styles.addSelection}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {form.selections.length === 0 && (
        <Text style={styles.empty}>Aucune sélection détectée.</Text>
      )}

      {form.selections.map((selection, index) => (
        <View key={index} style={styles.selectionCard}>
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionTitle}>Sélection {index + 1}</Text>
            <TouchableOpacity onPress={() => removeSelection(index)}>
              <Text style={styles.remove}>Supprimer</Text>
            </TouchableOpacity>
          </View>
          <Field label="Match" confidence={selection.confidence.match} hasValue={selection.match !== ""}>
            <TextInput
              style={styles.input}
              value={selection.match}
              onChangeText={(v) => setSelection(index, { match: v })}
            />
          </Field>
          <Field label="Marché" confidence={selection.confidence.market} hasValue={selection.market !== ""}>
            <TextInput
              style={styles.input}
              value={selection.market}
              onChangeText={(v) => setSelection(index, { market: v })}
            />
          </Field>
          <Field
            label="Sélection"
            confidence={selection.confidence.selection}
            hasValue={selection.selection !== ""}
          >
            <TextInput
              style={styles.input}
              value={selection.selection}
              onChangeText={(v) => setSelection(index, { selection: v })}
            />
          </Field>
          <Field label="Cote" confidence={selection.confidence.odds} hasValue={selection.odds !== ""}>
            <TextInput
              style={styles.input}
              value={selection.odds}
              onChangeText={(v) => setSelection(index, { odds: v })}
              keyboardType="decimal-pad"
            />
          </Field>
        </View>
      ))}

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? "Enregistrement…" : "Enregistrer le pari"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({
  label,
  confidence,
  hasValue,
  children,
}: {
  label: string;
  confidence: number;
  hasValue: boolean;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <ConfidenceBadge confidence={confidence} hasValue={hasValue} />
      </View>
      {children}
    </View>
  );
}

function ChipRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[styles.chip, value === option.value && styles.chipActive]}
          onPress={() => onChange(option.value)}
        >
          <Text style={[styles.chipText, value === option.value && styles.chipTextActive]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 14,
    backgroundColor: "#0f1420",
  },
  mockBanner: {
    backgroundColor: "#3a2c0f",
    borderWidth: 1,
    borderColor: "#d97706",
    borderRadius: 10,
    padding: 12,
  },
  mockBannerText: {
    color: "#fbbf24",
    fontSize: 13,
  },
  image: {
    width: "100%",
    height: 240,
    borderRadius: 10,
    backgroundColor: "#000",
  },
  field: {
    gap: 6,
  },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: "#232b3d",
    backgroundColor: "#161d2e",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f1f5f9",
    fontSize: 15,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#232b3d",
    backgroundColor: "#161d2e",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  chipText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#fff",
  },
  selectionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  sectionTitle: {
    color: "#f1f5f9",
    fontSize: 16,
    fontWeight: "700",
  },
  addSelection: {
    color: "#818cf8",
    fontWeight: "600",
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
    gap: 10,
  },
  selectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectionTitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  remove: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
  },
  error: {
    color: "#ef4444",
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: "#6366f1",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
