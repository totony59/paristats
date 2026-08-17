import { Router } from "express";
import { getStatsOverview } from "../services/statsService.js";

export const statsRouter = Router();

statsRouter.get("/", async (_req, res, next) => {
  try {
    const stats = await getStatsOverview();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});
