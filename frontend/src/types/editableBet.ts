import type { AIAnalysisResult, BetStatus, BetType, CreateBetPayload } from "@paristats/shared";

export interface EditableSelection {
  match: string;
  market: string;
  selection: string;
  odds: string;
  confidence: { match: number; market: number; selection: number; odds: number };
}

export interface EditableBet {
  bookmaker: string;
  date: string;
  time: string;
  sport: string;
  competition: string;
  betType: BetType | "";
  stake: string;
  totalOdds: string;
  potentialWin: string;
  totalReturn: string;
  status: BetStatus;
  betExternalId: string;
  selections: EditableSelection[];
}

export interface FieldConfidence {
  bookmaker: number;
  date: number;
  time: number;
  sport: number;
  competition: number;
  betType: number;
  stake: number;
  totalOdds: number;
  potentialWin: number;
  totalReturn: number;
  status: number;
  betExternalId: number;
}

export function fromAnalysisResult(result: AIAnalysisResult): {
  form: EditableBet;
  confidence: FieldConfidence;
} {
  return {
    form: {
      bookmaker: result.bookmaker.value ?? "",
      date: result.date.value ?? "",
      time: result.time.value ?? "",
      sport: result.sport.value ?? "Football",
      competition: result.competition.value ?? "",
      betType: result.betType.value ?? "",
      stake: numberToInput(result.stake.value),
      totalOdds: numberToInput(result.totalOdds.value),
      potentialWin: numberToInput(result.potentialWin.value),
      totalReturn: numberToInput(result.totalReturn.value),
      status: result.status.value ?? "pending",
      betExternalId: result.betExternalId.value ?? "",
      selections: result.selections.map((s) => ({
        match: s.match.value ?? "",
        market: s.market.value ?? "",
        selection: s.selection.value ?? "",
        odds: numberToInput(s.odds.value),
        confidence: {
          match: s.match.confidence,
          market: s.market.confidence,
          selection: s.selection.confidence,
          odds: s.odds.confidence,
        },
      })),
    },
    confidence: {
      bookmaker: result.bookmaker.confidence,
      date: result.date.confidence,
      time: result.time.confidence,
      sport: result.sport.confidence,
      competition: result.competition.confidence,
      betType: result.betType.confidence,
      stake: result.stake.confidence,
      totalOdds: result.totalOdds.confidence,
      potentialWin: result.potentialWin.confidence,
      totalReturn: result.totalReturn.confidence,
      status: result.status.confidence,
      betExternalId: result.betExternalId.confidence,
    },
  };
}

export function toCreateBetPayload(form: EditableBet): CreateBetPayload {
  return {
    bookmaker: emptyToNull(form.bookmaker),
    date: emptyToNull(form.date),
    time: emptyToNull(form.time),
    sport: emptyToNull(form.sport),
    competition: emptyToNull(form.competition),
    betType: form.betType === "" ? null : form.betType,
    stake: inputToNumber(form.stake),
    totalOdds: inputToNumber(form.totalOdds),
    potentialWin: inputToNumber(form.potentialWin),
    totalReturn: inputToNumber(form.totalReturn),
    status: form.status,
    betExternalId: emptyToNull(form.betExternalId),
    selections: form.selections.map((s) => ({
      match: emptyToNull(s.match),
      market: emptyToNull(s.market),
      selection: emptyToNull(s.selection),
      odds: inputToNumber(s.odds),
    })),
  };
}

function numberToInput(value: number | null): string {
  return value != null ? String(value) : "";
}

function inputToNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
