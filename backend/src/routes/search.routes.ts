import { Router } from "express";
import { extractIntent } from "../services/intent.service.js";
import { generateQueryEmbedding } from "../services/gemini.service.js";
import { hybridSearch } from "../services/retrieval.service.js";
import { normalizeFilters } from "../services/filter-normalizer.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Valid message required" });
    }

    // Step 1: Extract intent
    const intentData = await extractIntent(message);
    console.log("Intent extracted:", intentData);

    // If not a recommendation request, return early
    if (intentData.intent !== "recommend") {
      return res.json(intentData);
    }

    // Step 2: Normalize filters
    const normalizedFilters = normalizeFilters(intentData.filters);
    console.log("Normalized filters:", normalizedFilters);

    // Step 3: Generate embedding for semantic search
    const queryText = intentData.semantic_query || message;
    const queryEmbedding = await generateQueryEmbedding(queryText);

    if (!queryEmbedding || queryEmbedding.length === 0) {
      return res.status(500).json({ error: "Failed to generate query embedding" });
    }

    // Step 4: Hybrid search
    const results = hybridSearch(queryEmbedding, normalizedFilters);

    res.json({
      intent: intentData.intent,
      filters: normalizedFilters,
      semantic_query: queryText,
      results,
      total: results.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    const errorMessage = error instanceof Error ? error.message : "Search failed";
    res.status(500).json({ error: errorMessage });
  }
});

export default router;