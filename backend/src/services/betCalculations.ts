import type { BetStatus } from "@paristats/shared";

// won: totalReturn - stake | lost: -stake | void: 0 | pending: null
export function computeActualProfit(
  status: BetStatus,
  stake: number | null,
  totalReturn: number | null,
): number | null {
  switch (status) {
    case "won":
      return stake == null || totalReturn == null ? null : round2(totalReturn - stake);
    case "lost":
      return stake == null ? null : -stake;
    case "void":
      return 0;
    case "pending":
    default:
      return null;
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
