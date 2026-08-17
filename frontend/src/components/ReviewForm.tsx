import type { ReactNode } from "react";
import type { BetStatus, BetType } from "@paristats/shared";
import type { EditableBet, EditableSelection, FieldConfidence } from "../types/editableBet";
import { ConfidenceBadge } from "./ConfidenceBadge";

const STATUS_LABELS: Record<BetStatus, string> = {
  pending: "En attente",
  won: "Gagné",
  lost: "Perdu",
  void: "Annulé",
};

const BET_TYPE_LABELS: Record<BetType, string> = {
  simple: "Simple",
  combine: "Combiné",
};

interface ReviewFormProps {
  previewUrl: string | null;
  form: EditableBet;
  confidence: FieldConfidence;
  onChange: (form: EditableBet) => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  saveError: string | null;
  aiMode: "mock" | "claude" | null;
}

function FieldRow({
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
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </label>
        <ConfidenceBadge confidence={confidence} hasValue={hasValue} />
      </div>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-slate-100 focus:border-accent focus:outline-none";

export function ReviewForm({
  previewUrl,
  form,
  confidence,
  onChange,
  onBack,
  onSave,
  saving,
  saveError,
  aiMode,
}: ReviewFormProps) {
  function set<K extends keyof EditableBet>(key: K, value: EditableBet[K]) {
    onChange({ ...form, [key]: value });
  }

  function setSelection(index: number, patch: Partial<EditableSelection>) {
    const selections = form.selections.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange({ ...form, selections });
  }

  function removeSelection(index: number) {
    onChange({ ...form, selections: form.selections.filter((_, i) => i !== index) });
  }

  function addSelection() {
    onChange({
      ...form,
      selections: [
        ...form.selections,
        {
          match: "",
          market: "",
          selection: "",
          odds: "",
          confidence: { match: 0, market: 0, selection: 0, odds: 0 },
        },
      ],
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {aiMode === "mock" && (
        <div className="rounded-lg border border-pending/40 bg-pending/10 px-4 py-2 text-sm text-pending">
          Mode démo — aucune clé ANTHROPIC_API_KEY configurée. Ces données sont une analyse simulée,
          pas une vraie lecture de ta capture. Vérifie/complète tous les champs avant d'enregistrer.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
          <div className="mb-3 text-sm font-medium text-slate-300">Capture originale</div>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Capture du ticket de pari"
              className="max-h-[36rem] w-full rounded-lg bg-black/20 object-contain"
            />
          )}
        </div>

        <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
          <div className="mb-4 text-sm font-medium text-slate-300">Informations extraites</div>
          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Bookmaker" confidence={confidence.bookmaker} hasValue={form.bookmaker !== ""}>
              <input
                className={inputClass}
                value={form.bookmaker}
                onChange={(e) => set("bookmaker", e.target.value)}
              />
            </FieldRow>
            <FieldRow label="Sport" confidence={confidence.sport} hasValue={form.sport !== ""}>
              <input
                className={inputClass}
                value={form.sport}
                onChange={(e) => set("sport", e.target.value)}
              />
            </FieldRow>
            <FieldRow label="Date" confidence={confidence.date} hasValue={form.date !== ""}>
              <input
                type="date"
                className={inputClass}
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </FieldRow>
            <FieldRow label="Heure" confidence={confidence.time} hasValue={form.time !== ""}>
              <input
                type="time"
                className={inputClass}
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
              />
            </FieldRow>
            <FieldRow
              label="Compétition"
              confidence={confidence.competition}
              hasValue={form.competition !== ""}
            >
              <input
                className={inputClass}
                value={form.competition}
                onChange={(e) => set("competition", e.target.value)}
              />
            </FieldRow>
            <FieldRow label="Type de pari" confidence={confidence.betType} hasValue={form.betType !== ""}>
              <select
                className={inputClass}
                value={form.betType}
                onChange={(e) => set("betType", e.target.value as EditableBet["betType"])}
              >
                <option value="">—</option>
                {(Object.keys(BET_TYPE_LABELS) as BetType[]).map((type) => (
                  <option key={type} value={type}>
                    {BET_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Mise (€)" confidence={confidence.stake} hasValue={form.stake !== ""}>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.stake}
                onChange={(e) => set("stake", e.target.value)}
              />
            </FieldRow>
            <FieldRow label="Cote totale" confidence={confidence.totalOdds} hasValue={form.totalOdds !== ""}>
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.totalOdds}
                onChange={(e) => set("totalOdds", e.target.value)}
              />
            </FieldRow>
            <FieldRow
              label="Gain potentiel (€)"
              confidence={confidence.potentialWin}
              hasValue={form.potentialWin !== ""}
            >
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.potentialWin}
                onChange={(e) => set("potentialWin", e.target.value)}
              />
            </FieldRow>
            <FieldRow
              label="Retour total (€)"
              confidence={confidence.totalReturn}
              hasValue={form.totalReturn !== ""}
            >
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.totalReturn}
                onChange={(e) => set("totalReturn", e.target.value)}
              />
            </FieldRow>
            <FieldRow label="Statut" confidence={confidence.status} hasValue={Boolean(form.status)}>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => set("status", e.target.value as BetStatus)}
              >
                {(Object.keys(STATUS_LABELS) as BetStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow
              label="Identifiant du pari"
              confidence={confidence.betExternalId}
              hasValue={form.betExternalId !== ""}
            >
              <input
                className={inputClass}
                value={form.betExternalId}
                onChange={(e) => set("betExternalId", e.target.value)}
              />
            </FieldRow>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-300">Sélections</div>
          <button
            type="button"
            onClick={addSelection}
            className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-slate-300 hover:bg-surface-border"
          >
            + Ajouter une sélection
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {form.selections.length === 0 && (
            <div className="text-sm text-slate-500">Aucune sélection détectée.</div>
          )}
          {form.selections.map((selection, index) => (
            <div key={index} className="rounded-lg border border-surface-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-medium text-slate-400">Sélection {index + 1}</div>
                <button
                  type="button"
                  onClick={() => removeSelection(index)}
                  className="text-xs text-loss hover:underline"
                >
                  Supprimer
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow
                  label="Match"
                  confidence={selection.confidence.match}
                  hasValue={selection.match !== ""}
                >
                  <input
                    className={inputClass}
                    value={selection.match}
                    onChange={(e) => setSelection(index, { match: e.target.value })}
                  />
                </FieldRow>
                <FieldRow
                  label="Marché"
                  confidence={selection.confidence.market}
                  hasValue={selection.market !== ""}
                >
                  <input
                    className={inputClass}
                    value={selection.market}
                    onChange={(e) => setSelection(index, { market: e.target.value })}
                  />
                </FieldRow>
                <FieldRow
                  label="Sélection"
                  confidence={selection.confidence.selection}
                  hasValue={selection.selection !== ""}
                >
                  <input
                    className={inputClass}
                    value={selection.selection}
                    onChange={(e) => setSelection(index, { selection: e.target.value })}
                  />
                </FieldRow>
                <FieldRow
                  label="Cote"
                  confidence={selection.confidence.odds}
                  hasValue={selection.odds !== ""}
                >
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    value={selection.odds}
                    onChange={(e) => setSelection(index, { odds: e.target.value })}
                  />
                </FieldRow>
              </div>
            </div>
          ))}
        </div>
      </div>

      {saveError && (
        <div className="rounded-lg border border-loss/40 bg-loss/10 px-4 py-2 text-sm text-loss">
          {saveError}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="rounded-lg border border-surface-border px-4 py-2 text-sm text-slate-300 hover:bg-surface-border disabled:opacity-50"
        >
          Modifier la capture
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer le pari"}
        </button>
      </div>
    </div>
  );
}
