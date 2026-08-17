import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { DEFAULT_API_URL, getApiUrl, resetApiUrl, setApiUrl, testConnection } from "../config/apiConfig";

export function SettingsScreen() {
  const [apiUrl, setApiUrlState] = useState(DEFAULT_API_URL);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    getApiUrl().then(setApiUrlState);
  }, []);

  async function handleSaveUrl() {
    await setApiUrl(apiUrl);
    setTestResult(null);
  }

  async function handleResetUrl() {
    await resetApiUrl();
    setApiUrlState(DEFAULT_API_URL);
    setTestResult(null);
  }

  async function handleTestConnection() {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(apiUrl);
    setTestResult(result);
    setTesting(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Connexion backend</Text>
        <Text style={styles.cardHint}>
          Adresse du serveur PariStats. Par défaut, le backend hébergé — inutile d'y toucher sauf
          pour du développement local.
        </Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrlState}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://paristats-backend.onrender.com"
          placeholderTextColor="#64748b"
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSaveUrl}>
            <Text style={styles.secondaryButtonText}>Enregistrer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleTestConnection} disabled={testing}>
            {testing ? (
              <ActivityIndicator color="#818cf8" />
            ) : (
              <Text style={styles.secondaryButtonText}>Tester la connexion</Text>
            )}
          </TouchableOpacity>
        </View>
        {testResult && (
          <Text style={[styles.testResult, { color: testResult.ok ? "#22c55e" : "#ef4444" }]}>
            {testResult.ok ? "✅ " : "❌ "}
            {testResult.message}
          </Text>
        )}
        <TouchableOpacity onPress={handleResetUrl}>
          <Text style={styles.resetLink}>Réinitialiser à l'adresse par défaut</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
    backgroundColor: "#0f1420",
  },
  card: {
    borderWidth: 1,
    borderColor: "#232b3d",
    backgroundColor: "#161d2e",
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    color: "#f1f5f9",
    fontWeight: "700",
    fontSize: 15,
  },
  cardHint: {
    color: "#64748b",
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#232b3d",
    backgroundColor: "#0f1420",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f1f5f9",
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#232b3d",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#cbd5e1",
    fontWeight: "600",
    fontSize: 13,
  },
  testResult: {
    fontSize: 13,
    fontWeight: "600",
  },
  resetLink: {
    color: "#818cf8",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
