import type {
  AIAnalyzeResponse,
  BankrollOverview,
  Bet,
  CreateBankrollTransactionPayload,
  CreateBetPayload,
  DashboardStats,
  StatsOverview,
} from "@paristats/shared";
import { getApiUrl } from "../config/apiConfig";

export interface PickedImage {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}

// Le backend hébergé (palier gratuit) peut mettre jusqu'à ~1 min à se réveiller après une
// période d'inactivité : toute requête doit tolérer ce délai plutôt que de rester bloquée
// indéfiniment (fetch n'a pas de timeout par défaut) ou d'échouer trop tôt à tort.
const REQUEST_TIMEOUT_MS = 70_000;

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        "Le serveur met trop de temps à répondre. Il se réveille peut-être après une pause — réessaie dans une minute.",
      );
    }
    throw new Error(
      "Impossible de joindre le backend. Vérifie ta connexion et l'adresse du serveur (écran Accueil).",
    );
  } finally {
    clearTimeout(timeout);
  }
}

// Le réseau natif RN 0.86 (build standalone) rejette l'ancien objet {uri,name,type}
// ("Unsupported FormDataPart implementation") : il faut un vrai Blob. On le construit
// en relisant le fichier local via fetch(), puis on force son type MIME exact.
async function toFormDataBlob(image: PickedImage): Promise<{ blob: Blob; name: string }> {
  const type = image.mimeType ?? guessMimeType(image.uri);
  const name = image.fileName ?? image.uri.split("/").pop() ?? `capture-${Date.now()}.jpg`;
  const localFile = await fetch(image.uri);
  const rawBlob = await localFile.blob();
  const blob = rawBlob.slice(0, rawBlob.size, type);
  return { blob, name };
}

function guessMimeType(uri: string): string {
  const extension = uri.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchDashboard(): Promise<DashboardStats> {
  const baseUrl = await getApiUrl();
  const res = await fetchWithTimeout(`${baseUrl}/api/dashboard`);
  if (!res.ok) {
    throw new Error(`Impossible de charger le dashboard (${res.status}).`);
  }
  return res.json();
}

export async function analyzeBetImage(image: PickedImage): Promise<AIAnalyzeResponse> {
  const baseUrl = await getApiUrl();
  const { blob, name } = await toFormDataBlob(image);
  const form = new FormData();
  form.append("image", blob, name);
  const res = await fetchWithTimeout(`${baseUrl}/api/ai/analyze`, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `L'analyse a échoué (${res.status}).`));
  }
  return res.json();
}

// La capture n'est jamais envoyée à l'enregistrement : elle ne sert qu'à l'analyse IA,
// jamais persistée côté serveur (demande explicite : pas de conservation des images).
export async function createBet(payload: CreateBetPayload): Promise<Bet> {
  const baseUrl = await getApiUrl();
  const res = await fetchWithTimeout(`${baseUrl}/api/bets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `L'enregistrement a échoué (${res.status}).`));
  }
  return res.json();
}

export async function fetchBets(): Promise<Bet[]> {
  const baseUrl = await getApiUrl();
  const res = await fetchWithTimeout(`${baseUrl}/api/bets`);
  if (!res.ok) {
    throw new Error(`Impossible de charger la liste des paris (${res.status}).`);
  }
  return res.json();
}

export async function fetchBetById(id: string): Promise<Bet> {
  const baseUrl = await getApiUrl();
  const res = await fetchWithTimeout(`${baseUrl}/api/bets/${id}`);
  if (!res.ok) {
    throw new Error(`Impossible de charger ce pari (${res.status}).`);
  }
  return res.json();
}

export async function fetchBankroll(): Promise<BankrollOverview> {
  const baseUrl = await getApiUrl();
  const res = await fetchWithTimeout(`${baseUrl}/api/bankroll`);
  if (!res.ok) {
    throw new Error(`Impossible de charger la bankroll (${res.status}).`);
  }
  return res.json();
}

export async function createBankrollTransaction(
  payload: CreateBankrollTransactionPayload,
): Promise<void> {
  const baseUrl = await getApiUrl();
  const res = await fetchWithTimeout(`${baseUrl}/api/bankroll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `L'ajout a échoué (${res.status}).`));
  }
}

export async function fetchStats(): Promise<StatsOverview> {
  const baseUrl = await getApiUrl();
  const res = await fetchWithTimeout(`${baseUrl}/api/stats`);
  if (!res.ok) {
    throw new Error(`Impossible de charger les statistiques (${res.status}).`);
  }
  return res.json();
}
