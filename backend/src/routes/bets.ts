import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import type { Bet, BetStatus, BetType } from "@paristats/shared";
import type { Bet as PrismaBet, BetSelection as PrismaBetSelection } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { computeActualProfit } from "../services/betCalculations.js";

const nullableString = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : v),
  z.string().nullable(),
);

const nullableDateString = nullableString.pipe(
  z.string().refine((v) => !Number.isNaN(Date.parse(v)), { message: "Date invalide" }).nullable(),
);

const createBetSelectionSchema = z.object({
  match: nullableString,
  market: nullableString,
  selection: nullableString,
  odds: z.number().nullable(),
});

const createBetSchema = z.object({
  date: nullableDateString,
  time: nullableString,
  bookmaker: nullableString,
  sport: nullableString,
  competition: nullableString,
  betType: z.enum(["simple", "combine"]).nullable(),
  stake: z.number().nullable(),
  totalOdds: z.number().nullable(),
  potentialWin: z.number().nullable(),
  totalReturn: z.number().nullable(),
  status: z.enum(["pending", "won", "lost", "void"]),
  betExternalId: nullableString,
  selections: z.array(createBetSelectionSchema),
});

const updateOutcomeSchema = z.object({
  status: z.enum(["pending", "won", "lost", "void"]),
  // Si absent, on garde le totalReturn déjà enregistré (utile pour "Perdu"/"Annulé"
  // qui n'en ont pas besoin) ; si fourni (même null), il remplace la valeur existante.
  totalReturn: z.number().nullable().optional(),
});

export const betsRouter = Router();

betsRouter.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const bets = await prisma.bet.findMany({
      include: { selections: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    res.json(bets.map(serializeBet));
  } catch (err) {
    next(err);
  }
});

betsRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bet = await prisma.bet.findUnique({
      where: { id: req.params.id },
      include: { selections: true },
    });
    if (!bet) {
      res.status(404).json({ error: "Pari introuvable." });
      return;
    }
    res.json(serializeBet(bet));
  } catch (err) {
    next(err);
  }
});

betsRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await handleCreate(req, res);
  } catch (err) {
    next(err);
  }
});

betsRouter.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await handleUpdateOutcome(req, res);
  } catch (err) {
    next(err);
  }
});

betsRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.bet.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "Pari introuvable." });
      return;
    }
    // Les sélections partent avec (onDelete: Cascade dans le schema).
    await prisma.bet.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

async function handleCreate(req: Request, res: Response) {
  let payload: z.infer<typeof createBetSchema>;
  try {
    payload = createBetSchema.parse(req.body);
  } catch (err) {
    res.status(400).json({
      error: "Données du pari invalides.",
      details: err instanceof z.ZodError ? err.flatten() : undefined,
    });
    return;
  }

  // Le bénéfice réel est toujours recalculé côté serveur : on ne fait jamais confiance
  // à une valeur envoyée par le client, même issue d'un écran de vérification.
  const actualProfit = computeActualProfit(payload.status, payload.stake, payload.totalReturn);

  // La capture n'est jamais persistée : elle ne sert qu'à l'analyse IA côté client,
  // jamais renvoyée ni stockée à l'enregistrement.
  const bet = await prisma.bet.create({
    data: {
      date: payload.date ? new Date(payload.date) : null,
      time: payload.time,
      bookmaker: payload.bookmaker,
      sport: payload.sport,
      competition: payload.competition,
      betType: payload.betType,
      stake: payload.stake,
      totalOdds: payload.totalOdds,
      potentialWin: payload.potentialWin,
      totalReturn: payload.totalReturn,
      actualProfit,
      status: payload.status,
      betExternalId: payload.betExternalId,
      selections: {
        create: payload.selections.map((s) => ({
          match: s.match,
          market: s.market,
          selection: s.selection,
          odds: s.odds,
        })),
      },
    },
    include: { selections: true },
  });

  res.status(201).json(serializeBet(bet));
}

async function handleUpdateOutcome(req: Request, res: Response) {
  let payload: z.infer<typeof updateOutcomeSchema>;
  try {
    payload = updateOutcomeSchema.parse(req.body);
  } catch (err) {
    res.status(400).json({
      error: "Données invalides.",
      details: err instanceof z.ZodError ? err.flatten() : undefined,
    });
    return;
  }

  const existing = await prisma.bet.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    res.status(404).json({ error: "Pari introuvable." });
    return;
  }

  const totalReturn = payload.totalReturn !== undefined ? payload.totalReturn : existing.totalReturn;
  const actualProfit = computeActualProfit(payload.status, existing.stake, totalReturn);

  const bet = await prisma.bet.update({
    where: { id: existing.id },
    data: { status: payload.status, totalReturn, actualProfit },
    include: { selections: true },
  });

  res.json(serializeBet(bet));
}

function serializeBet(bet: PrismaBet & { selections: PrismaBetSelection[] }): Bet {
  return {
    id: bet.id,
    date: bet.date ? bet.date.toISOString() : null,
    time: bet.time,
    bookmaker: bet.bookmaker,
    sport: bet.sport,
    competition: bet.competition,
    betType: bet.betType as BetType | null,
    totalOdds: bet.totalOdds,
    stake: bet.stake,
    potentialWin: bet.potentialWin,
    totalReturn: bet.totalReturn,
    actualProfit: bet.actualProfit,
    status: bet.status as BetStatus,
    confidence: bet.confidence,
    betExternalId: bet.betExternalId,
    needsReview: bet.needsReview,
    screenshotPath: bet.screenshotPath,
    createdAt: bet.createdAt.toISOString(),
    updatedAt: bet.updatedAt.toISOString(),
    selections: bet.selections.map((s) => ({
      id: s.id,
      betId: s.betId,
      match: s.match,
      market: s.market,
      selection: s.selection,
      odds: s.odds,
    })),
  };
}
