import type { AIAnalyzeResponse, Bet, CreateBetPayload, DashboardStats } from "@paristats/shared";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) {
    throw new Error(`Requête échouée (${res.status}) sur ${path}`);
  }
  return res.json() as Promise<T>;
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function fetchDashboard(): Promise<DashboardStats> {
  return request<DashboardStats>("/dashboard");
}

export async function analyzeBetImage(
  file: File,
  mockScenario?: string,
): Promise<AIAnalyzeResponse> {
  const form = new FormData();
  form.append("image", file);
  const query = mockScenario ? `?scenario=${encodeURIComponent(mockScenario)}` : "";
  const res = await fetch(`/api/ai/analyze${query}`, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `L'analyse a échoué (${res.status}).`));
  }
  return res.json();
}

export async function createBet(payload: CreateBetPayload, image: File | null): Promise<Bet> {
  const form = new FormData();
  form.append("data", JSON.stringify(payload));
  if (image) {
    form.append("image", image);
  }
  const res = await fetch("/api/bets", { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `L'enregistrement a échoué (${res.status}).`));
  }
  return res.json();
}
