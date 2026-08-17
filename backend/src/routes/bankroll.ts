import { Router } from "express";
import { z } from "zod";
import type { BankrollOverview, BankrollTransaction } from "@paristats/shared";
import { prisma } from "../db/prisma.js";
import { getBankrollSummary } from "../services/bankrollService.js";

const createTransactionSchema = z.object({
  type: z.enum(["deposit", "withdrawal"]),
  amount: z.number().positive(),
  note: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().nullable(),
  ),
});

export const bankrollRouter = Router();

bankrollRouter.get("/", async (_req, res, next) => {
  try {
    const [summary, transactions] = await Promise.all([
      getBankrollSummary(),
      prisma.bankrollTransaction.findMany({ orderBy: { date: "desc" } }),
    ]);

    const overview: BankrollOverview = {
      ...summary,
      transactions: transactions.map(serializeTransaction),
    };
    res.json(overview);
  } catch (err) {
    next(err);
  }
});

bankrollRouter.post("/", async (req, res, next) => {
  try {
    const payload = createTransactionSchema.parse(req.body);
    const transaction = await prisma.bankrollTransaction.create({
      data: { type: payload.type, amount: payload.amount, note: payload.note },
    });
    res.status(201).json(serializeTransaction(transaction));
  } catch (err) {
    if (err instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Données de transaction invalides.", details: err.flatten() });
      return;
    }
    next(err);
  }
});

bankrollRouter.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.bankrollTransaction.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: "Transaction introuvable." });
      return;
    }
    await prisma.bankrollTransaction.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

function serializeTransaction(t: {
  id: string;
  type: string;
  amount: number;
  date: Date;
  note: string | null;
}): BankrollTransaction {
  return {
    id: t.id,
    type: t.type as BankrollTransaction["type"],
    amount: t.amount,
    date: t.date.toISOString(),
    note: t.note,
  };
}
