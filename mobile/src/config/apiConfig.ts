import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "paristats.apiBaseUrl";

export const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

let cachedUrl: string | null = null;

export async function getApiUrl(): Promise<string> {
  if (cachedUrl) return cachedUrl;
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const resolved = stored && stored.trim() !== "" ? stored : DEFAULT_API_URL;
  cachedUrl = resolved;
  return resolved;
}

export async function setApiUrl(url: string): Promise<void> {
  const trimmed = url.trim().replace(/\/+$/, "");
  cachedUrl = trimmed;
  await AsyncStorage.setItem(STORAGE_KEY, trimmed);
}

export async function resetApiUrl(): Promise<void> {
  cachedUrl = DEFAULT_API_URL;
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

// Le backend hébergé (palier gratuit) se met en veille après 15 min d'inactivité et met
// jusqu'à ~1 min à se réveiller au premier appel suivant : le délai doit tolérer ce cas,
// sinon un simple réveil à froid apparaîtrait à tort comme une erreur de connexion.
const CONNECTION_TEST_TIMEOUT_MS = 70_000;

export async function testConnection(url: string): Promise<ConnectionTestResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONNECTION_TEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/api/health`, {
      signal: controller.signal,
    });
    if (!res.ok) {
      return { ok: false, message: `Le serveur a répondu avec une erreur (${res.status}).` };
    }
    return { ok: true, message: "Connexion réussie." };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        ok: false,
        message: "Toujours pas de réponse après 70s. Réessaie — le serveur met parfois ~1 min à se réveiller après une période d'inactivité.",
      };
    }
    return { ok: false, message: "Impossible de joindre le backend. Vérifie l'adresse et le réseau." };
  } finally {
    clearTimeout(timeout);
  }
}
