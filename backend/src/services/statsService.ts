import type { Bet } from "@prisma/client";
import type { StatsBreakdown, StatsOverview } from "@paristats/shared";
import { prisma } from "../db/prisma.js";
import { average, sum } from "../utils/math.js";

const BET_TYPE_LABELS: Record<string, string> = {
  simple: "Simple",
  combine: "Combiné",
};

export async function getStatsOverview(): Promise<StatsOverview> {
  const bets = await prisma.bet.findMany();

  return {
    global: computeGlobal(bets),
    byBetType: computeBreakdown(
      bets,
      (bet) => bet.betType ?? "unknown",
      (key) => BET_TYPE_LABELS[key] ?? "Non renseigné",
    ),
    byCompetition: computeBreakdown(
      bets,
      (bet) => bet.competition ?? "unknown",
      (key) => (key === "unknown" ? "Compétition non renseignée" : key),
    ),
  };
}

function computeGlobal(bets: Bet[]): StatsOverview["global"] {
  const settled = bets.filter((b) => b.status !== "pending");
  const won = bets.filter((b) => b.status === "won");
  const lost = bets.filter((b) => b.status === "lost");
  const decidedCount = won.length + lost.length;
  const settledStake = sum(settled.map((b) => b.stake));
  const netProfit = sum(settled.map((b) => b.actualProfit));

  return {
    netProfit,
    roi: settledStake > 0 ? (netProfit / settledStake) * 100 : 0,
    successRate: decidedCount > 0 ? (won.length / decidedCount) * 100 : 0,
    averageOdds: average(bets.map((b) => b.totalOdds)),
    averageStake: average(bets.map((b) => b.stake)),
    averageWin: average(won.map((b) => b.actualProfit)),
    averageLoss: average(lost.map((b) => b.actualProfit)),
  };
}

function computeBreakdown(
  bets: Bet[],
  keyOf: (bet: Bet) => string,
  labelOf: (key: string) => string,
): StatsBreakdown[] {
  const groups = new Map<string, Bet[]>();
  for (const bet of bets) {
    const key = keyOf(bet);
    const list = groups.get(key);
    if (list) {
      list.push(bet);
    } else {
      groups.set(key, [bet]);
    }
  }

  const breakdown: StatsBreakdown[] = [];
  for (const [key, groupBets] of groups) {
    const settled = groupBets.filter((b) => b.status !== "pending");
    const won = groupBets.filter((b) => b.status === "won");
    const lost = groupBets.filter((b) => b.status === "lost");
    const decidedCount = won.length + lost.length;
    const settledStake = sum(settled.map((b) => b.stake));
    const netProfit = sum(settled.map((b) => b.actualProfit));

    breakdown.push({
      key,
      label: labelOf(key),
      totalBets: groupBets.length,
      wonBets: won.length,
      lostBets: lost.length,
      successRate: decidedCount > 0 ? (won.length / decidedCount) * 100 : 0,
      netProfit,
      roi: settledStake > 0 ? (netProfit / settledStake) * 100 : 0,
      averageOdds: average(groupBets.map((b) => b.totalOdds)),
    });
  }

  return breakdown.sort((a, b) => b.netProfit - a.netProfit);
}
