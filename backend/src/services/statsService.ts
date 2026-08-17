import type { Bet, BetSelection } from "@prisma/client";
import type { StatsBreakdown, StatsOverview } from "@paristats/shared";
import { prisma } from "../db/prisma.js";
import { average, sum } from "../utils/math.js";

type BetWithSelections = Bet & { selections: BetSelection[] };

const BET_TYPE_LABELS: Record<string, string> = {
  simple: "Simple",
  combine: "Combiné",
};

export async function getStatsOverview(): Promise<StatsOverview> {
  const bets = await prisma.bet.findMany({ include: { selections: true } });

  return {
    global: computeGlobal(bets),
    byBetType: computeBreakdown(
      groupBy(bets, (bet) => bet.betType ?? "unknown"),
      (key) => BET_TYPE_LABELS[key] ?? "Non renseigné",
    ),
    byCompetition: computeBreakdown(
      groupBy(bets, (bet) => bet.competition ?? "unknown"),
      (key) => (key === "unknown" ? "Compétition non renseignée" : key),
    ),
    byTeam: computeBreakdown(groupByTeam(bets), (key) => key),
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

function groupBy<T extends Bet>(bets: T[], keyOf: (bet: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const bet of bets) {
    const key = keyOf(bet);
    const list = groups.get(key);
    if (list) {
      list.push(bet);
    } else {
      groups.set(key, [bet]);
    }
  }
  return groups;
}

/**
 * Regroupe par équipe, uniquement à partir des paris SIMPLES dont la sélection correspond
 * exactement à l'une des deux équipes du match (ex. "PSG" sur "PSG - Marseille"). Les
 * combinés et les marchés qui ne désignent pas directement une équipe (totaux, BTTS,
 * double chance...) sont exclus : impossible d'attribuer un gain/perte à une équipe
 * précise sans deviner, ce que l'app ne fait jamais.
 */
function groupByTeam(bets: BetWithSelections[]): Map<string, BetWithSelections[]> {
  const groups = new Map<string, BetWithSelections[]>();
  for (const bet of bets) {
    if (bet.betType !== "simple" || bet.selections.length !== 1) continue;
    const selection = bet.selections[0];
    if (!selection.match || !selection.selection) continue;
    const teams = selection.match
      .split(" - ")
      .map((t) => t.trim())
      .filter(Boolean);
    const picked = teams.find(
      (team) => team.toLowerCase() === selection.selection!.trim().toLowerCase(),
    );
    if (!picked) continue;
    const list = groups.get(picked);
    if (list) {
      list.push(bet);
    } else {
      groups.set(picked, [bet]);
    }
  }
  return groups;
}

function computeBreakdown(
  groups: Map<string, Bet[]>,
  labelOf: (key: string) => string,
): StatsBreakdown[] {
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
