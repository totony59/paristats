import type { BankrollPoint } from "@paristats/shared";
import { prisma } from "../db/prisma.js";
import { sum } from "../utils/math.js";

export interface BankrollSummary {
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  netProfit: number;
  history: BankrollPoint[];
}

/**
 * Calcul central de la bankroll, réutilisé par le dashboard et par /api/bankroll
 * pour ne jamais avoir deux formules différentes.
 */
export async function getBankrollSummary(): Promise<BankrollSummary> {
  const [settledBets, transactions] = await Promise.all([
    prisma.bet.findMany({ where: { status: { not: "pending" } } }),
    prisma.bankrollTransaction.findMany({ orderBy: { date: "asc" } }),
  ]);

  const totalDeposits = sum(
    transactions.filter((t) => t.type === "deposit").map((t) => t.amount),
  );
  const totalWithdrawals = sum(
    transactions.filter((t) => t.type === "withdrawal").map((t) => t.amount),
  );
  const netProfit = sum(settledBets.map((bet) => bet.actualProfit));
  const balance = totalDeposits - totalWithdrawals + netProfit;

  return {
    balance,
    totalDeposits,
    totalWithdrawals,
    netProfit,
    history: computeBankrollHistory(settledBets, transactions, totalDeposits - totalWithdrawals),
  };
}

interface HistoryEvent {
  date: Date;
  delta: number;
}

export function computeBankrollHistory(
  settledBets: Array<{ date: Date | null; createdAt: Date; actualProfit: number | null }>,
  transactions: Array<{ date: Date; type: string; amount: number }>,
  netCashFlow: number,
): BankrollPoint[] {
  const events: HistoryEvent[] = [];

  for (const t of transactions) {
    events.push({ date: t.date, delta: t.type === "deposit" ? t.amount : -t.amount });
  }
  for (const bet of settledBets) {
    events.push({ date: bet.date ?? bet.createdAt, delta: bet.actualProfit ?? 0 });
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  let running = 0;
  const points: BankrollPoint[] = events.map((event) => {
    running += event.delta;
    return { date: event.date.toISOString(), balance: running };
  });

  if (points.length === 0) {
    return [{ date: new Date().toISOString(), balance: netCashFlow }];
  }

  return points;
}
