export type BetStatus = "pending" | "won" | "lost" | "void";
export type BetType = "simple" | "combine";
export type TransactionType = "deposit" | "withdrawal";

export interface BetSelection {
  id: string;
  betId: string;
  match: string | null;
  market: string | null;
  selection: string | null;
  odds: number | null;
}

export interface Bet {
  id: string;
  date: string | null;
  time: string | null;
  bookmaker: string | null;
  sport: string | null;
  competition: string | null;
  betType: BetType | null;
  totalOdds: number | null;
  stake: number | null;
  potentialWin: number | null;
  totalReturn: number | null;
  actualProfit: number | null;
  status: BetStatus;
  confidence: number | null;
  betExternalId: string | null;
  needsReview: boolean;
  screenshotPath: string | null;
  createdAt: string;
  updatedAt: string;
  selections: BetSelection[];
}

export interface BankrollTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  note: string | null;
}

export interface BankrollPoint {
  date: string;
  balance: number;
}

export interface DashboardStats {
  bankroll: number;
  totalStake: number;
  totalReturn: number;
  netProfit: number;
  roi: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
  successRate: number;
  averageStake: number;
  averageOdds: number;
  bankrollHistory: BankrollPoint[];
}

/** Champ extrait par l'IA : la valeur (ou null si absente/illisible) et un score de confiance 0-1. */
export interface ConfidenceField<T> {
  value: T | null;
  confidence: number;
}

export interface AIBetSelectionResult {
  match: ConfidenceField<string>;
  market: ConfidenceField<string>;
  selection: ConfidenceField<string>;
  odds: ConfidenceField<number>;
}

export interface AIAnalysisResult {
  bookmaker: ConfidenceField<string>;
  date: ConfidenceField<string>;
  time: ConfidenceField<string>;
  sport: ConfidenceField<string>;
  competition: ConfidenceField<string>;
  betType: ConfidenceField<BetType>;
  stake: ConfidenceField<number>;
  totalOdds: ConfidenceField<number>;
  potentialWin: ConfidenceField<number>;
  totalReturn: ConfidenceField<number>;
  status: ConfidenceField<BetStatus>;
  betExternalId: ConfidenceField<string>;
  selections: AIBetSelectionResult[];
}

/** Réponse de POST /api/ai/analyze. mode="mock" signale une analyse simulée (pas de clé API configurée). */
export interface AIAnalyzeResponse {
  mode: "mock" | "claude";
  result: AIAnalysisResult;
}

/** Payload envoyé par le frontend à POST /api/bets après validation humaine. */
export interface CreateBetPayload {
  date: string | null;
  time: string | null;
  bookmaker: string | null;
  sport: string | null;
  competition: string | null;
  betType: BetType | null;
  stake: number | null;
  totalOdds: number | null;
  potentialWin: number | null;
  totalReturn: number | null;
  status: BetStatus;
  betExternalId: string | null;
  selections: Array<{
    match: string | null;
    market: string | null;
    selection: string | null;
    odds: number | null;
  }>;
}

/** Réponse de GET /api/bankroll. */
export interface BankrollOverview {
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  netProfit: number;
  history: BankrollPoint[];
  transactions: BankrollTransaction[];
}

/** Payload envoyé par le frontend à POST /api/bankroll pour ajouter un dépôt/retrait. */
export interface CreateBankrollTransactionPayload {
  type: TransactionType;
  amount: number;
  note: string | null;
}

export interface StatsBreakdown {
  key: string;
  label: string;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  successRate: number;
  netProfit: number;
  roi: number;
  averageOdds: number;
}

/** Réponse de GET /api/stats. */
export interface StatsOverview {
  global: {
    netProfit: number;
    roi: number;
    successRate: number;
    averageOdds: number;
    averageStake: number;
    averageWin: number;
    averageLoss: number;
  };
  byBetType: StatsBreakdown[];
  byCompetition: StatsBreakdown[];
}
