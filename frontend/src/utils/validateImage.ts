import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_MB } from "../constants/upload";

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Format non supporté. Utilise une image JPG, PNG ou WEBP.";
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `Image trop volumineuse (max ${MAX_UPLOAD_MB} Mo).`;
  }
  return null;
}
