import fs from "node:fs/promises";
import path from "node:path";
import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import type { Bet, BetStatus, BetType } from "@paristats/shared";
import type { Bet as PrismaBet, BetSelection as PrismaBetSelection } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { handleImageUpload } from "../middleware/imageUpload.js";
import { computeActualProfit } from "../services/betCalculations.js";
import { EXTENSION_BY_MIME, UPLOAD_DIR } from "../config/uploads.js";

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

betsRouter.post(
  "/",
  handleImageUpload("image", { required: false }),
  (req: Request, res: Response, next: NextFunction) => {
    handleCreate(req, res).catch(next);
  },
);

async function handleCreate(req: Request, res: Response) {
  const rawData = typeof req.body.data === "string" ? req.body.data : null;
  if (!rawData) {
    res.status(400).json({ error: "Données du pari manquantes." });
    return;
  }

  let payload: z.infer<typeof createBetSchema>;
  try {
    payload = createBetSchema.parse(JSON.parse(rawData));
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

  let bet = await prisma.bet.create({
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

  if (req.file) {
    const extension = EXTENSION_BY_MIME[req.file.mimetype] ?? "";
    const filename = `${bet.id}${extension}`;
    await fs.writeFile(path.join(UPLOAD_DIR, filename), req.file.buffer);
    bet = await prisma.bet.update({
      where: { id: bet.id },
      data: { screenshotPath: filename },
      include: { selections: true },
    });
  }

  res.status(201).json(serializeBet(bet));
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
