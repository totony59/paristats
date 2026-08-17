import { useEffect, useState } from "react";
import { ImportDropzone } from "../components/ImportDropzone";
import { ReviewForm } from "../components/ReviewForm";
import { analyzeBetImage, createBet } from "../api/client";
import { fromAnalysisResult, toCreateBetPayload } from "../types/editableBet";
import type { EditableBet, FieldConfidence } from "../types/editableBet";

type Step = "select" | "analyzing" | "review" | "done";

export function Import() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<"mock" | "claude" | null>(null);
  const [form, setForm] = useState<EditableBet | null>(null);
  const [confidence, setConfidence] = useState<FieldConfidence | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFileSelected(selected: File) {
    setFile(selected);
    setAnalyzeError(null);
  }

  function handleRemove() {
    setFile(null);
    setAnalyzeError(null);
  }

  async function handleAnalyze() {
    if (!file) return;
    setStep("analyzing");
    setAnalyzeError(null);
    try {
      const response = await analyzeBetImage(file);
      const { form: editable, confidence: fieldConfidence } = fromAnalysisResult(response.result);
      setForm(editable);
      setConfidence(fieldConfidence);
      setAiMode(response.mode);
      setStep("review");
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Erreur inconnue pendant l'analyse.");
      setStep("select");
    }
  }

  function handleBackToCapture() {
    setStep("select");
    setForm(null);
    setConfidence(null);
    setSaveError(null);
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createBet(toCreateBetPayload(form), file);
      setStep("done");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erreur inconnue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setFile(null);
    setForm(null);
    setConfidence(null);
    setAiMode(null);
    setAnalyzeError(null);
    setSaveError(null);
    setStep("select");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">Importer un pari</h1>
        <p className="mt-1 text-sm text-slate-400">
          Dépose une capture d'écran de ton ticket Betclic, laisse l'IA lire les informations, puis
          vérifie et enregistre.
        </p>
      </div>

      {step === "done" ? (
        <div className="rounded-xl border border-profit/40 bg-profit/10 p-6 text-center">
          <div className="text-lg font-medium text-profit">Pari enregistré</div>
          <p className="mt-1 text-sm text-slate-300">
            Les statistiques et la bankroll ont été mises à jour.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            Importer un autre pari
          </button>
        </div>
      ) : step === "review" && form && confidence ? (
        <ReviewForm
          previewUrl={previewUrl}
          form={form}
          confidence={confidence}
          onChange={setForm}
          onBack={handleBackToCapture}
          onSave={handleSave}
          saving={saving}
          saveError={saveError}
          aiMode={aiMode}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <ImportDropzone
            file={file}
            previewUrl={previewUrl}
            onFileSelected={handleFileSelected}
            onRemove={handleRemove}
          />
          {analyzeError && (
            <div className="rounded-lg border border-loss/40 bg-loss/10 px-4 py-2 text-sm text-loss">
              {analyzeError}
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!file || step === "analyzing"}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {step === "analyzing" ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Analyse en cours…
                </span>
              ) : (
                "Analyser avec l'IA"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
