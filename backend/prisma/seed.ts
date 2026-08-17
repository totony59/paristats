import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Selection = { match: string; market: string; selection: string; odds: number };

interface SeedBet {
  date: string;
  bookmaker: string;
  sport: string;
  competition: string;
  betType: "simple" | "combine";
  stake: number;
  totalOdds: number;
  status: "won" | "lost" | "void" | "pending";
  selections: Selection[];
}

// won: totalReturn = stake * totalOdds, profit = totalReturn - stake
// lost: totalReturn = null, profit = -stake
// void: totalReturn = stake (remboursé), profit = 0
// pending: tout null
function deriveOutcome(bet: SeedBet) {
  const potentialWin = round2(bet.stake * bet.totalOdds);
  switch (bet.status) {
    case "won":
      return { potentialWin, totalReturn: potentialWin, actualProfit: round2(potentialWin - bet.stake) };
    case "lost":
      return { potentialWin, totalReturn: null, actualProfit: -bet.stake };
    case "void":
      return { potentialWin, totalReturn: bet.stake, actualProfit: 0 };
    case "pending":
      return { potentialWin, totalReturn: null, actualProfit: null };
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

const seedBets: SeedBet[] = [
  {
    date: "2026-06-22",
    bookmaker: "Betclic",
    sport: "Football",
    competition: "Ligue 1",
    betType: "simple",
    stake: 20,
    totalOdds: 1.65,
    status: "won",
    selections: [{ match: "PSG - Marseille", market: "1N2", selection: "PSG", odds: 1.65 }],
  },
  {
    date: "2026-06-25",
    bookmaker: "Betclic",
    sport: "Football",
    competition: "Premier League",
    betType: "simple",
    stake: 15,
    totalOdds: 1.9,
    status: "lost",
    selections: [{ match: "Man City - Arsenal", market: "Total buts", selection: "+2.5", odds: 1.9 }],
  },
  {
    date: "2026-06-29",
    bookmaker: "Betclic",
    sport: "Football",
    competition: "Ligue des Champions",
    betType: "combine",
    stake: 10,
    totalOdds: 3.4,
    status: "won",
    selections: [
      { match: "Real Madrid - Celtic", market: "1N2", selection: "Real Madrid", odds: 1.4 },
      { match: "Bayern - Slavia Prague", market: "1N2", selection: "Bayern", odds: 2.43 },
    ],
  },
  {
    date: "2026-07-02",
    bookmaker: "Betclic",
    sport: "Football",
    competition: "Liga",
    betType: "simple",
    stake: 25,
    totalOdds: 2.1,
    status: "lost",
    selections: [{ match: "Real Madrid - Barcelone", market: "1N2", selection: "Barcelone", odds: 2.1 }],
  },
  {
    date: "2026-07-05",
    bookmaker: "Betclic",
    sport: "Football",
    competition: "Ligue 1",
    betType: "simple",
    stake: 30,
    totalOdds: 1.4,
    status: "won",
    selections: [{ match: "Lyon - Monaco", market: "Double chance", selection: "1N", odds: 1.4 }],
  },
  {
    date: "2026-07-09",
    bookmaker: "Betclic",
    sport: "Football",
    competition: "Serie A",
    betType: "combine",
    stake: 10,
    totalOdds: 5.2,
    status: "lost",
    selections: [
      { match: "Juventus - Inter", market: "1N2", selection: "Inter", odds: 2.1 },
      { match: "AC Milan - Roma", market: "1N2", selection: "AC Milan", odds: 1.9 },
      { match: "Napoli - Atalanta", market: "Double chance", selection: "1N", odds: 1.3 },
    ],
  },
  {
    date: "2026-07-12",
    bookmaker: "Betclic",
    sport: "Football",
    competition: "Premier League",
    betType: "simple",
    stake: 20,
    totalOdds: 1.75,
    status: "void",
    selections: [{ match: "Liverpool - Chelsea", market: "1N2", selection: "Liverpool", odds: 1.75 }],
  },
  {
    date: "2026-07-16",
    bookmaker: "Betclic",
    sport: "Football",
    competition: "Ligue 1",
    betType: "simple",
    stake: 40,
    totalOdds: 1.5,
    status: "won",
    selections: [{ match: "PSG - Lille", market: "1N2", selection: "PSG", odds: 1.5 }],
  },
  {
    date: "2026-07-20",
    bookmaker: "Betclic",
    sport: "Football",
    competition: "Bundesliga",
    betType: "combine",
    stake: 15,
    totalOdds: 2.8,
    status: "won",
    selections: [
      { match: "Bayern - Dortmund", market: "1N2", selection: "Bayern", odds: 1.55 },
      { match: "Leverkusen - Leipzig", market: "1N2", selection: "Leverkusen", odds: 1.81 },
    ],
  },
  {
    date: "2026-07-24",
    bookmaker: "Betclic",
    sport: "Football",
    competition: "Liga",
    betType: "simple",
    stake: 20,
    totalOdds: 2.3,
    status: "lost",
    selections: [{ match: "Atletico Madrid - Séville", market: "1N2", selection: "Séville", odds: 2.3 }],
  },
  {
    date: "2026-07-29",
    bookmaker: "Betclic",
    sport: "Football",
    competition: "Ligue des Champions",
    betType: "combine",
    stake: 10,
    totalOdds: 4.1,
    status: "lost",
    selections: [
      { match: "Man City - PSG", market: "1N2", selection: "Man City", odds: 1.7 },
      { match: "Arsenal - Bayern", market: "1N2", selection: "Arsenal", odds: 2.41 },
    ],
  },
  {
    date: "2026-08-02",
    bookmaker: "Betclic",
    sport: "Football",
    competition: "Ligue 1",
    betType: "simple",
    stake: 25,
    totalOdds: 1.85,
    status: "won",
    selections: [{ match: "Marseille - Nice", market: "1N2", selection: "Marseille", odds: 1.85 }],
  },
  {
    date: "2026-08-06",
    bookmaker: "Betclic",
    sport: "Football",
    competition: "Premier League",
    betType: "simple",
    stake: 20,
    totalOdds: 2.0,
    status: "pending",
    selections: [{ match: "Arsenal - Tottenham", market: "1N2", selection: "Arsenal", odds: 2.0 }],
  },
  {
    date: "2026-08-11",
    bookmaker: "Betclic",
    sport: "Football",
    competition: "Ligue 1",
    betType: "combine",
    stake: 15,
    totalOdds: 3.6,
    status: "pending",
    selections: [
      { match: "PSG - Monaco", market: "1N2", selection: "PSG", odds: 1.5 },
      { match: "Lyon - Lens", market: "1N2", selection: "Lyon", odds: 2.4 },
    ],
  },
  {
    date: "2026-08-14",
    bookmaker: "Betclic",
    sport: "Football",
    competition: "Serie A",
    betType: "simple",
    stake: 20,
    totalOdds: 1.7,
    status: "pending",
    selections: [{ match: "AC Milan - Napoli", market: "1N2", selection: "AC Milan", odds: 1.7 }],
  },
];

async function main() {
  await prisma.betSelection.deleteMany();
  await prisma.bet.deleteMany();
  await prisma.bankrollTransaction.deleteMany();

  await prisma.bankrollTransaction.createMany({
    data: [
      { type: "deposit", amount: 500, date: new Date("2026-06-15"), note: "Dépôt initial" },
      { type: "deposit", amount: 200, date: new Date("2026-07-15"), note: "Recharge" },
      { type: "withdrawal", amount: 100, date: new Date("2026-08-01"), note: "Retrait" },
    ],
  });

  for (const bet of seedBets) {
    const { potentialWin, totalReturn, actualProfit } = deriveOutcome(bet);
    await prisma.bet.create({
      data: {
        date: new Date(bet.date),
        bookmaker: bet.bookmaker,
        sport: bet.sport,
        competition: bet.competition,
        betType: bet.betType,
        stake: bet.stake,
        totalOdds: bet.totalOdds,
        potentialWin,
        totalReturn,
        actualProfit,
        status: bet.status,
        confidence: 1,
        selections: {
          create: bet.selections.map((s) => ({
            match: s.match,
            market: s.market,
            selection: s.selection,
            odds: s.odds,
          })),
        },
      },
    });
  }

  console.log(`Seed terminé : ${seedBets.length} paris et 3 transactions de bankroll créés.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
