import { Router, type NextFunction, type Request, type Response } from "express";
import { handleImageUpload } from "../middleware/imageUpload.js";
import { analyzeBetScreenshot, AiAnalysisError } from "../services/aiAnalysis.js";
import type { MockScenario } from "../services/aiMock.js";

export const aiRouter = Router();

aiRouter.post(
  "/analyze",
  handleImageUpload("image", { required: true }),
  (req: Request, res: Response, next: NextFunction) => {
    handleAnalyze(req, res).catch(next);
  },
);

async function handleAnalyze(req: Request, res: Response) {
  const mockScenario =
    typeof req.query.scenario === "string" ? (req.query.scenario as MockScenario) : undefined;

  try {
    const analysis = await analyzeBetScreenshot({
      buffer: req.file!.buffer,
      mimeType: req.file!.mimetype,
      mockScenario,
    });
    res.json(analysis);
  } catch (err) {
    if (err instanceof AiAnalysisError) {
      res.status(502).json({ error: err.message, code: err.code });
      return;
    }
    throw err;
  }
}
