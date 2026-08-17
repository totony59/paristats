import fs from "node:fs";
import path from "node:path";

export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "bets");

export function ensureUploadDir(): void {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
