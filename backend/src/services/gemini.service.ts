import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY, EMBEDDING_MODEL } from "../config/env.js";

// Initialize the Google GenAI client
const genai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

/**
 * Generate embedding for a query text using Gemini embedding model
 * @param text - The text to generate embeddings for
 * @returns Array of embedding values
 */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error("Text cannot be empty");
    }

    // Generate embedding using the embedContent method
    const response = await genai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: [
        {
          parts: [{ text }],
        },
      ],
    });

    // Extract embedding values
    const embedding = response.embeddings?.[0]?.values;

    if (!embedding || embedding.length === 0) {
      throw new Error("Empty embedding returned from model");
    }

    return embedding;
  } catch (error) {
    console.error("Error generating query embedding:", error);
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
