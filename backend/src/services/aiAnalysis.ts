import Anthropic from "@anthropic-ai/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { AIAnalyzeResponse } from "@paristats/shared";
import { aiAnalysisSchema } from "./aiSchema.js";
import { BET_ANALYSIS_SYSTEM_PROMPT, BET_ANALYSIS_USER_INSTRUCTION } from "./aiPrompt.js";
import { generateMockAnalysis, type MockScenario } from "./aiMock.js";

const TOOL_NAME = "extract_bet_data";
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

const { $schema: _ignored, ...toolInputSchema } = zodToJsonSchema(aiAnalysisSchema) as Record<
  string,
  unknown
>;

export class AiAnalysisError extends Error {
  constructor(
    message: string,
    public readonly code: "provider_error" | "invalid_response",
  ) {
    super(message);
    this.name = "AiAnalysisError";
  }
}

export interface AnalyzeOptions {
  buffer: Buffer;
  mimeType: string;
  /** Réservé aux tests en mode mock : force un scénario précis plutôt qu'un tirage aléatoire. */
  mockScenario?: MockScenario;
}

const CLAUDE_TIMEOUT_MS = 45_000;

/**
 * Point d'entrée unique pour l'analyse d'une capture de ticket de pari.
 * Isolé du reste de l'app pour pouvoir changer de fournisseur IA sans rien
 * modifier ailleurs. Mode déterminé par resolveMode() : mock tant qu'aucune
 * ANTHROPIC_API_KEY n'est configurée (ou si AI_PROVIDER=mock force le repli,
 * ex. en cas de souci avec Claude Vision, sans avoir à retirer la clé).
 */
export async function analyzeBetScreenshot(options: AnalyzeOptions): Promise<AIAnalyzeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const mode = resolveMode(apiKey);
  console.log(`[aiAnalysis] analyse en mode "${mode}"`);

  let raw: unknown;
  try {
    if (mode === "claude") {
      if (!apiKey) {
        throw new Error(
          "ANTHROPIC_API_KEY manquante dans backend/.env alors que AI_PROVIDER=claude force le mode réel.",
        );
      }
      raw = await callClaude(apiKey, options.buffer, options.mimeType);
    } else {
      raw = generateMockAnalysis(options.mockScenario ?? "random");
    }
  } catch (err) {
    throw new AiAnalysisError(describeProviderError(err), "provider_error");
  }

  const parsed = aiAnalysisSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[aiAnalysis] réponse IA invalide :", parsed.error.flatten());
    throw new AiAnalysisError(
      "La réponse de l'IA ne correspond pas au format attendu.",
      "invalid_response",
    );
  }

  return { mode, result: parsed.data };
}

function resolveMode(apiKey: string | undefined): "mock" | "claude" {
  const forced = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (forced === "mock") return "mock";
  if (forced === "claude") return "claude";
  return apiKey ? "claude" : "mock";
}

function describeProviderError(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    if (err.status === 401) return "Clé API Anthropic invalide ou refusée par le serveur Claude.";
    if (err.status === 429)
      return "Limite de requêtes Claude atteinte, réessaie dans quelques instants.";
    if (err.status === 529 || err.status === 503)
      return "Le service Claude est momentanément surchargé, réessaie.";
    if (err.status && err.status >= 500)
      return "Erreur côté serveur Claude, réessaie dans quelques instants.";
    return `Erreur de l'API Claude (${err.status ?? "inconnu"}) : ${err.message}`;
  }
  if (err instanceof Error && err.name === "APIConnectionTimeoutError") {
    return "L'analyse Claude a dépassé le délai autorisé (45s), réessaie.";
  }
  if (err instanceof Error && err.name === "APIConnectionError") {
    return "Impossible de joindre l'API Claude depuis le backend (vérifie la connexion internet du PC).";
  }
  return err instanceof Error ? err.message : "Erreur inconnue du fournisseur IA.";
}

async function callClaude(apiKey: string, buffer: Buffer, mimeType: string): Promise<unknown> {
  if (!SUPPORTED_IMAGE_TYPES.includes(mimeType as SupportedImageType)) {
    throw new Error(`Type d'image non supporté par l'analyse IA : ${mimeType}`);
  }

  const anthropic = new Anthropic({ apiKey, timeout: CLAUDE_TIMEOUT_MS });
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5";

  const message = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    system: BET_ANALYSIS_SYSTEM_PROMPT,
    tools: [
      {
        name: TOOL_NAME,
        description: "Extrait les données structurées visibles sur un ticket de pari sportif.",
        input_schema: toolInputSchema as Anthropic.Tool["input_schema"],
      },
    ],
    tool_choice: { type: "tool", name: TOOL_NAME },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as SupportedImageType,
              data: buffer.toString("base64"),
            },
          },
          { type: "text", text: BET_ANALYSIS_USER_INSTRUCTION },
        ],
      },
    ],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("Claude n'a pas retourné de données structurées.");
  }
  return toolUse.input;
}
