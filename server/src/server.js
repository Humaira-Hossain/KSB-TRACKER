import cors from "cors";
import express from "express";
import { pool } from "./db.js";
import catalogRoutes from "./routes/catalog.routes.js";
import evidenceRoutes from "./routes/evidence.routes.js";
import notesRoutes from "./routes/notes.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import taskRoutes from "./routes/tasks.routes.js";

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_request, response, next) => {
  try {
    await pool.query("SELECT 1");
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

app.use("/api", catalogRoutes);
app.use("/api", taskRoutes);
app.use("/api", evidenceRoutes);
app.use("/api", notesRoutes);
app.use("/api", progressRoutes);

app.use((error, _request, response) => {
  console.error(error);
  response.status(error.status || 500).json({ error: error.status ? error.message : "Internal server error." });
});

app.listen(port, () => {
  console.log(`KSB Tracker API listening on port ${port}`);
});
