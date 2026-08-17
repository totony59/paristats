import { useRef, useState, type DragEvent } from "react";
import { ACCEPTED_IMAGE_EXTENSIONS, MAX_UPLOAD_MB } from "../constants/upload";
import { validateImageFile } from "../utils/validateImage";

interface ImportDropzoneProps {
  file: File | null;
  previewUrl: string | null;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
}

export function ImportDropzone({ file, previewUrl, onFileSelected, onRemove }: ImportDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(fileList: FileList | null) {
    const selected = fileList?.[0];
    if (!selected) return;
    const validationError = validateImageFile(selected);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onFileSelected(selected);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED_IMAGE_EXTENSIONS}
      className="hidden"
      onChange={(event) => handleFiles(event.target.files)}
    />
  );

  if (file && previewUrl) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface-raised p-4">
        <div className="mb-3 text-sm font-medium text-slate-300">Capture du pari</div>
        <img
          src={previewUrl}
          alt="Aperçu du ticket de pari"
          className="max-h-96 w-full rounded-lg bg-black/20 object-contain"
        />
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-surface-border"
          >
            Remplacer l'image
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg border border-loss/40 px-3 py-2 text-sm text-loss transition-colors hover:bg-loss/10"
          >
            Supprimer
          </button>
        </div>
        {fileInput}
      </div>
    );
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
      }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
        isDragging
          ? "border-accent bg-accent/5"
          : "border-surface-border bg-surface-raised hover:border-accent/50"
      }`}
    >
      <div className="text-sm font-medium text-slate-200">
        Glisse-dépose une capture du ticket ici
      </div>
      <div className="mt-1 text-xs text-slate-500">
        ou clique pour choisir un fichier — JPG, PNG, WEBP (max {MAX_UPLOAD_MB} Mo)
      </div>
      {error && <div className="mt-3 text-sm text-loss">{error}</div>}
      {fileInput}
    </div>
  );
}
