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
  const res = await fetch(`${baseUrl}/api/dashboard`);
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
  const res = await fetch(`${baseUrl}/api/ai/analyze`, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `L'analyse a échoué (${res.status}).`));
  }
  return res.json();
}

export async function createBet(payload: CreateBetPayload, image: PickedImage | null): Promise<Bet> {
  const baseUrl = await getApiUrl();
  const form = new FormData();
  form.append("data", JSON.stringify(payload));
  if (image) {
    const { blob, name } = await toFormDataBlob(image);
    form.append("image", blob, name);
  }
  const res = await fetch(`${baseUrl}/api/bets`, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `L'enregistrement a échoué (${res.status}).`));
  }
  return res.json();
}

export async function fetchBets(): Promise<Bet[]> {
  const baseUrl = await getApiUrl();
  const res = await fetch(`${baseUrl}/api/bets`);
  if (!res.ok) {
    throw new Error(`Impossible de charger la liste des paris (${res.status}).`);
  }
  return res.json();
}

export async function fetchBetById(id: string): Promise<Bet> {
  const baseUrl = await getApiUrl();
  const res = await fetch(`${baseUrl}/api/bets/${id}`);
  if (!res.ok) {
    throw new Error(`Impossible de charger ce pari (${res.status}).`);
  }
  return res.json();
}

export async function fetchBankroll(): Promise<BankrollOverview> {
  const baseUrl = await getApiUrl();
  const res = await fetch(`${baseUrl}/api/bankroll`);
  if (!res.ok) {
    throw new Error(`Impossible de charger la bankroll (${res.status}).`);
  }
  return res.json();
}

export async function createBankrollTransaction(
  payload: CreateBankrollTransactionPayload,
): Promise<void> {
  const baseUrl = await getApiUrl();
  const res = await fetch(`${baseUrl}/api/bankroll`, {
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
  const res = await fetch(`${baseUrl}/api/stats`);
  if (!res.ok) {
    throw new Error(`Impossible de charger les statistiques (${res.status}).`);
  }
  return res.json();
}

export async function buildScreenshotUrl(screenshotPath: string): Promise<string> {
  const baseUrl = await getApiUrl();
  return `${baseUrl}/uploads/bets/${screenshotPath}`;
}
