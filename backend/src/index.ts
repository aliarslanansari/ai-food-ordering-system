import express from "express";
import cors from "cors";
import { initDB } from "./db/init.js";
import path from "path";
import { loadFoods } from "./services/data.service.js";
import { loadEmbeddings } from "./services/embedding.service.js";
import { hybridSearch } from "./services/retrieval.service.js";
import searchRoutes from "./routes/search.routes.js";

loadFoods();
loadEmbeddings();
initDB();

const __dirname = path.resolve();
const frontendPath = path.join(__dirname, "dist-frontend");

const app = express();
const PORT = process.env.PORT || 5200;

// app.use((req, res, next) => {
//   console.log("Incoming:", req.method, req.url, new Date().toISOString());
//   next();
// });

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "Backend running" });
});

app.use("/api/search", searchRoutes);

app.use(express.static(frontendPath));

app.get(/(.*)/, (_req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
