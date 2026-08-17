import "dotenv/config";
import express from "express";
import cors from "cors";
import { dashboardRouter } from "./routes/dashboard.js";
import { aiRouter } from "./routes/ai.js";
import { betsRouter } from "./routes/bets.js";
import { bankrollRouter } from "./routes/bankroll.js";
import { statsRouter } from "./routes/stats.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ensureUploadDir, UPLOAD_DIR } from "./config/uploads.js";

ensureUploadDir();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

app.use("/uploads/bets", express.static(UPLOAD_DIR));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/dashboard", dashboardRouter);
app.use("/api/ai", aiRouter);
app.use("/api/bets", betsRouter);
app.use("/api/bankroll", bankrollRouter);
app.use("/api/stats", statsRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`PariStats backend démarré sur http://localhost:${port}`);
});
