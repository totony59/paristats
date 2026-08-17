import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { TabScreenProps } from "../navigation/types";
import { analyzeBetImage, type PickedImage } from "../api/client";

type Props = TabScreenProps<"Scanner">;

export function ScannerScreen({ navigation }: Props) {
  const [image, setImage] = useState<PickedImage | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toPickedImage(asset: ImagePicker.ImagePickerAsset): PickedImage {
    return { uri: asset.uri, mimeType: asset.mimeType, fileName: asset.fileName };
  }

  async function handleTakePhoto() {
    setError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError(
          "Permission caméra refusée. Active-la dans les réglages Android pour scanner un ticket.",
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) {
        setError("Aucune photo capturée.");
        return;
      }
      setImage(toPickedImage(asset));
    } catch {
      setError("La prise de photo a échoué. Réessaie.");
    }
  }

  async function handlePickFromGallery() {
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(
          "Permission galerie refusée. Active-la dans les réglages Android pour importer une capture.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) {
        setError("Aucune image sélectionnée.");
        return;
      }
      setImage(toPickedImage(asset));
    } catch {
      setError("La sélection de l'image a échoué. Réessaie.");
    }
  }

  async function handleAnalyze() {
    if (!image) return;
    setAnalyzing(true);
    setError(null);
    try {
      const response = await analyzeBetImage(image);
      navigation.navigate("Verification", { analysis: response, image });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue pendant l'analyse.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Scanner un pari</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.pickButton} onPress={handleTakePhoto}>
          <Text style={styles.pickButtonEmoji}>📷</Text>
          <Text style={styles.pickButtonLabel}>Prendre une photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pickButton} onPress={handlePickFromGallery}>
          <Text style={styles.pickButtonEmoji}>🖼️</Text>
          <Text style={styles.pickButtonLabel}>Choisir une capture</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {image && (
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>Capture du pari</Text>
          <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="contain" />
          <TouchableOpacity
            style={[styles.analyzeButton, analyzing && styles.analyzeButtonDisabled]}
            onPress={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <View style={styles.analyzingRow}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.analyzeButtonText}>Analyse du ticket…</Text>
              </View>
            ) : (
              <Text style={styles.analyzeButtonText}>Analyser le pari</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#f1f5f9",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  pickButton: {
    flex: 1,
    backgroundColor: "#161d2e",
    borderWidth: 1,
    borderColor: "#232b3d",
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: "center",
    gap: 8,
  },
  pickButtonEmoji: {
    fontSize: 32,
  },
  pickButtonLabel: {
    color: "#e2e8f0",
    fontWeight: "600",
    textAlign: "center",
  },
  error: {
    color: "#ef4444",
    fontSize: 14,
  },
  previewCard: {
    backgroundColor: "#161d2e",
    borderWidth: 1,
    borderColor: "#232b3d",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  previewLabel: {
    color: "#cbd5e1",
    fontWeight: "600",
  },
  preview: {
    width: "100%",
    height: 320,
    borderRadius: 8,
    backgroundColor: "#000",
  },
  analyzeButton: {
    backgroundColor: "#6366f1",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  analyzeButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
