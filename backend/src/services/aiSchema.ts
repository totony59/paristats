import { z } from "zod";

function confidenceField<T extends z.ZodTypeAny>(valueSchema: T) {
  return z.object({
    value: valueSchema.nullable(),
    confidence: z.number().min(0).max(1),
  });
}

export const aiBetSelectionSchema = z.object({
  match: confidenceField(z.string()),
  market: confidenceField(z.string()),
  selection: confidenceField(z.string()),
  odds: confidenceField(z.number()),
});

export const aiAnalysisSchema = z.object({
  bookmaker: confidenceField(z.string()),
  date: confidenceField(z.string()),
  time: confidenceField(z.string()),
  sport: confidenceField(z.string()),
  competition: confidenceField(z.string()),
  betType: confidenceField(z.enum(["simple", "combine"])),
  stake: confidenceField(z.number()),
  totalOdds: confidenceField(z.number()),
  potentialWin: confidenceField(z.number()),
  totalReturn: confidenceField(z.number()),
  status: confidenceField(z.enum(["pending", "won", "lost", "void"])),
  betExternalId: confidenceField(z.string()),
  selections: z.array(aiBetSelectionSchema),
});

export type AiAnalysisSchemaType = z.infer<typeof aiAnalysisSchema>;
