import multer from "multer";
import type { NextFunction, Request, Response } from "express";

export const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB) || 8;
const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ACCEPTED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("UNSUPPORTED_FILE_TYPE"));
      return;
    }
    cb(null, true);
  },
});

/** Middleware express prêt à l'emploi : parse un champ fichier image et renvoie des erreurs claires (taille/format). */
export function handleImageUpload(fieldName: string, { required }: { required: boolean }) {
  const middleware = upload.single(fieldName);
  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err: unknown) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          res.status(413).json({ error: `Image trop volumineuse (max ${MAX_UPLOAD_MB} Mo).` });
          return;
        }
        if (err instanceof Error && err.message === "UNSUPPORTED_FILE_TYPE") {
          res
            .status(400)
            .json({ error: "Format d'image non supporté (JPG, PNG ou WEBP uniquement)." });
          return;
        }
        next(err);
        return;
      }
      if (required && !req.file) {
        res.status(400).json({ error: "Aucune image fournie." });
        return;
      }
      next();
    });
  };
}
