import { getFoods } from "./data.service.js";
import { getEmbedding } from "./embedding.service.js";
import { cosineSimilarity } from "../utils/cosine.js";
import { Food } from "../types/food.js";

export interface Filters {
  category?: string;
  protein_min?: number;
  carbs_max?: number;
  vegetarian?: boolean;
  spiceLevel?: string;
  maxPrice?: number;
}

interface ScoredFood {
  food: Food;
  score: number;
}

/**
 * Enhanced category matching across multiple fields
 * Checks: category, name, ingredients, description
 */
function matchesCategory(food: Food, categoryQuery: string): boolean {
  if (!categoryQuery) return true;

  const query = categoryQuery.toLowerCase();

  // Check category field
  if (food.category?.toLowerCase().includes(query)) {
    return true;
  }

  // Check name
  if (food.name?.toLowerCase().includes(query)) {
    return true;
  }

  // Check ingredients
  if (food.ingredients?.some((ing) => ing.toLowerCase().includes(query))) {
    return true;
  }

  // Check description (but with lower weight in scoring)
  if (food.description?.toLowerCase().includes(query)) {
    return true;
  }

  return false;
}

/**
 * Hybrid search combining structured filtering and vector similarity
 * @param queryEmbedding - The embedding vector of the search query
 * @param filters - Structured filters to apply
 * @param topK - Number of results to return
 * @returns Array of Food items sorted by relevance
 */
export function hybridSearch(
  queryEmbedding: number[],
  filters: Filters = {},
  topK: number = 5,
): Food[] {
  try {
    let foods = getFoods();

    if (!foods || foods.length === 0) {
      console.warn("No foods available in database");
      return [];
    }

    const originalCount = foods.length;
    let filterStages: { stage: string; remaining: number; removed: number }[] =
      [];

    // Apply Structured Filters

    // Category filter (ENHANCED - multi-field fuzzy match)
    if (filters.category) {
      const beforeCount = foods.length;
      foods = foods.filter((f) => matchesCategory(f, filters.category!));
      const removed = beforeCount - foods.length;
      filterStages.push({
        stage: `Category: "${filters.category}"`,
        remaining: foods.length,
        removed: removed,
      });
    }

    // Protein minimum filter
    if (filters.protein_min !== undefined && filters.protein_min > 0) {
      const beforeCount = foods.length;
      foods = foods.filter((f) => {
        if (!f.nutrition || typeof f.nutrition.protein !== "number") {
          return false;
        }
        return f.nutrition.protein >= filters.protein_min!;
      });
      const removed = beforeCount - foods.length;
      filterStages.push({
        stage: `Protein ≥ ${filters.protein_min}g`,
        remaining: foods.length,
        removed: removed,
      });
    }

    // Carbs maximum filter
    if (filters.carbs_max !== undefined && filters.carbs_max > 0) {
      const beforeCount = foods.length;
      foods = foods.filter((f) => {
        if (!f.nutrition || typeof f.nutrition.carbs !== "number") {
          return false;
        }
        return f.nutrition.carbs <= filters.carbs_max!;
      });
      const removed = beforeCount - foods.length;
      filterStages.push({
        stage: `Carbs ≤ ${filters.carbs_max}g`,
        remaining: foods.length,
        removed: removed,
      });
    }

    // Vegetarian filter
    if (filters.vegetarian !== undefined) {
      const beforeCount = foods.length;
      foods = foods.filter((f) => f.isVegetarian === filters.vegetarian);
      const removed = beforeCount - foods.length;
      filterStages.push({
        stage: `Vegetarian: ${filters.vegetarian}`,
        remaining: foods.length,
        removed: removed,
      });
    }

    // Spice level filter (case-insensitive exact match)
    if (filters.spiceLevel) {
      const beforeCount = foods.length;
      const spiceLevelLower = filters.spiceLevel.toLowerCase();
      foods = foods.filter((f) => {
        if (!f.spiceLevel) return false;
        return f.spiceLevel.toLowerCase() === spiceLevelLower;
      });
      const removed = beforeCount - foods.length;
      filterStages.push({
        stage: `Spice Level: ${filters.spiceLevel}`,
        remaining: foods.length,
        removed: removed,
      });
    }

    // Price filter
    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      const beforeCount = foods.length;
      foods = foods.filter((f) => {
        if (typeof f.price !== "number") return false;
        return f.price <= filters.maxPrice!;
      });
      const removed = beforeCount - foods.length;
      filterStages.push({
        stage: `Price ≤ ₹${filters.maxPrice}`,
        remaining: foods.length,
        removed: removed,
      });
    }

    // If no foods remain after filtering
    if (foods.length === 0) {
      return [];
    }

    // Apply Vector Similarity Search
    if (!queryEmbedding || queryEmbedding.length === 0) {
      return foods.slice(0, topK);
    }

    const scoredFoods: ScoredFood[] = [];

    for (const food of foods) {
      try {
        const embedding = getEmbedding(food.id);

        // Skip if embedding is missing or invalid
        if (!embedding || embedding.length === 0) {
          continue;
        }

        // Verify embedding dimensions match
        if (embedding.length !== queryEmbedding.length) {
          continue;
        }

        // Calculate cosine similarity
        const score = cosineSimilarity(queryEmbedding, embedding);

        // Skip invalid scores
        if (isNaN(score) || !isFinite(score)) {
          continue;
        }

        scoredFoods.push({ food, score });
      } catch (error) {
        console.error(`  ❌ Error processing food ${food.id}:`, error);
        continue;
      }
    }

    if (scoredFoods.length === 0) {
      // Return filtered foods without ranking if no embeddings available
      return foods.slice(0, topK);
    }

    // Sort by similarity score (descending)
    scoredFoods.sort((a, b) => b.score - a.score);

    // Return top K results
    return scoredFoods.slice(0, topK).map((s) => s.food);
  } catch (error) {
    console.error("Error in hybrid search:", error);
    throw error;
  }
}

/**
 * Semantic-only search (fallback when structured filters fail)
 * @param queryEmbedding - The embedding vector of the search query
 * @param topK - Number of results to return
 * @returns Array of Food items sorted by semantic similarity
 */
export function semanticOnlySearch(
  queryEmbedding: number[],
  topK: number = 10,
): Food[] {
  try {
    const foods = getFoods();

    if (!queryEmbedding || queryEmbedding.length === 0) {
      return foods.slice(0, topK);
    }

    const scoredFoods: ScoredFood[] = [];

    for (const food of foods) {
      const embedding = getEmbedding(food.id);
      if (!embedding || embedding.length !== queryEmbedding.length) continue;

      const score = cosineSimilarity(queryEmbedding, embedding);
      if (isNaN(score) || !isFinite(score)) continue;

      scoredFoods.push({ food, score });
    }

    scoredFoods.sort((a, b) => b.score - a.score);
    return scoredFoods.slice(0, topK).map((s) => s.food);
  } catch (error) {
    console.error("Error in semantic-only search:", error);
    return [];
  }
}

/**
 * Simple keyword-based search (fallback when embeddings are not available)
 * @param query - Search query string
 * @param topK - Number of results to return
 * @returns Array of Food items
 */
export function keywordSearch(query: string, topK: number = 5): Food[] {
  try {
    const foods = getFoods();
    const queryLower = query.toLowerCase();

    const scored = foods.map((food) => {
      let score = 0;

      // Check name match (highest weight)
      if (food.name.toLowerCase().includes(queryLower)) {
        score += 10;
      }

      // Check category match
      if (food.category?.toLowerCase().includes(queryLower)) {
        score += 7;
      }

      // Check description match
      if (food.description?.toLowerCase().includes(queryLower)) {
        score += 5;
      }

      // Check ingredients match
      if (
        food.ingredients?.some((ing) => ing.toLowerCase().includes(queryLower))
      ) {
        score += 3;
      }

      return { food, score };
    });

    // Filter out zero scores and sort
    const filtered = scored.filter((s) => s.score > 0);
    filtered.sort((a, b) => b.score - a.score);

    return filtered.slice(0, topK).map((s) => s.food);
  } catch (error) {
    console.error("Error in keyword search:", error);
    return [];
  }
}
