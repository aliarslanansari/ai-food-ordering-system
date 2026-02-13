import fs from "fs";
import path from "path";

interface EmbeddingEntry {
  id: string;
  embedding: number[];
}

const __dirname = path.resolve();

const embeddingsPath = path.join(__dirname, "src", "data", "embeddings.json");

let embeddings: Map<string, number[]> = new Map();

export function loadEmbeddings() {
  const raw = fs.readFileSync(embeddingsPath, "utf-8");
  const parsed: EmbeddingEntry[] = JSON.parse(raw);

  embeddings = new Map(parsed.map((e) => [e.id, e.embedding]));

  console.log(`Loaded ${embeddings.size} embeddings`);
}

export function getEmbedding(id: string) {
  return embeddings.get(id);
}

export function getAllEmbeddings() {
  return embeddings;
}
