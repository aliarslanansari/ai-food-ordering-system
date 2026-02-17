import { GoogleGenAI } from "@google/genai";
import {
  GEMINI_API_KEY,
  EMBEDDING_MODEL,
  INTENT_MODEL,
} from "../config/env.js";
import { Food } from "../types/food.js";

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

/**
 * AI-powered semantic reference resolution
 * Uses Gemini to understand which items the user is referring to
 * @param reference - The user's reference (e.g., "the spicy one", "both", "the first")
 * @param candidates - List of candidate food items from conversation context
 * @returns Object with resolved indices, confidence, and reasoning
 */
export async function resolveReferenceWithAI(
  reference: string,
  candidates: Food[],
): Promise<{
  indices: number[];
  confidence: number;
  reasoning: string;
}> {
  try {
    if (!reference || reference.trim().length === 0) {
      return { indices: [], confidence: 0, reasoning: "No reference provided" };
    }

    if (candidates.length === 0) {
      return {
        indices: [],
        confidence: 0,
        reasoning: "No candidate items in context",
      };
    }

    // Build context with candidate items
    const itemsList = candidates
      .map(
        (f, i) =>
          `${i + 1}. ${f.name} - ${f.description} (₹${f.price}, ${f.category})`,
      )
      .join("\n");

    const prompt = `You are a reference resolution assistant for a food ordering chatbot.

The user previously saw these food items:
${itemsList}

The user now says: "${reference}"

Which item(s) is the user referring to? Respond in JSON format:
{
  "indices": [0-based indices of referred items, e.g., [0] for first item, [0,1] for multiple],
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of your reasoning"
}

Rules:
- "that", "it", "this" → usually refers to the first/most recent item [0]
- "first", "1st" → [0]
- "second", "2nd" → [1]
- "last" → [last index]
- "both", "all" → all indices [0,1,2,...]
- "the spicy one", "the vegetarian option" → match by description attributes
- "the cheaper one" → compare prices
- If ambiguous, use low confidence (< 0.5)
- If no match, return empty indices []`;

    const response = await genai.models.generateContent({
      model: INTENT_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    // Parse JSON response
    const result = JSON.parse(text) as {
      indices: number[];
      confidence: number;
      reasoning: string;
    };

    // Validate indices are within bounds
    const validIndices = result.indices.filter(
      (i) => i >= 0 && i < candidates.length,
    );

    return {
      indices: validIndices,
      confidence: Math.max(0, Math.min(1, result.confidence)),
      reasoning: result.reasoning || "AI-based resolution",
    };
  } catch (error) {
    console.error("Error in AI reference resolution:", error);
    return {
      indices: [],
      confidence: 0,
      reasoning: `AI resolution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
