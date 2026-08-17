import type { DashboardStats } from "@paristats/shared";
import { prisma } from "../db/prisma.js";
import { getBankrollSummary } from "./bankrollService.js";
import { average, sum } from "../utils/math.js";

export async function getDashboardStats(): Promise<DashboardStats> {
  const [bets, bankroll] = await Promise.all([prisma.bet.findMany(), getBankrollSummary()]);

  const settledBets = bets.filter((bet) => bet.status !== "pending");
  const wonBets = bets.filter((bet) => bet.status === "won");
  const lostBets = bets.filter((bet) => bet.status === "lost");
  const pendingBets = bets.filter((bet) => bet.status === "pending");

  const totalStake = sum(bets.map((bet) => bet.stake));
  // ROI se base sur les mises des paris déjà réglés (won/lost/void), pas sur les mises encore en jeu.
  const settledStake = sum(settledBets.map((bet) => bet.stake));
  const totalReturn = sum(wonBets.map((bet) => bet.totalReturn));

  const decidedCount = wonBets.length + lostBets.length;
  const successRate = decidedCount > 0 ? (wonBets.length / decidedCount) * 100 : 0;
  const roi = settledStake > 0 ? (bankroll.netProfit / settledStake) * 100 : 0;
  const averageStake = bets.length > 0 ? totalStake / bets.length : 0;
  const averageOdds = average(bets.map((bet) => bet.totalOdds));

  return {
    bankroll: bankroll.balance,
    totalStake,
    totalReturn,
    netProfit: bankroll.netProfit,
    roi,
    totalBets: bets.length,
    wonBets: wonBets.length,
    lostBets: lostBets.length,
    pendingBets: pendingBets.length,
    successRate,
    averageStake,
    averageOdds,
    bankrollHistory: bankroll.history,
  };
}
