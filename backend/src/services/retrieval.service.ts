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

    console.log(`Starting hybrid search with ${foods.length} foods`);
    console.log("Applied filters:", filters);

    // Apply Structured Filters

    // Category filter (fuzzy match - supports partial matches)
    if (filters.category) {
      const categoryLower = filters.category.toLowerCase();
      foods = foods.filter((f) => {
        if (!f.category) return false;
        
        const foodCategory = f.category.toLowerCase();
        // Check if category contains the filter term or vice versa
        return (
          foodCategory.includes(categoryLower) ||
          categoryLower.includes(foodCategory)
        );
      });
      console.log(`After category filter: ${foods.length} foods`);
    }

    // Protein minimum filter
    if (filters.protein_min !== undefined && filters.protein_min > 0) {
      foods = foods.filter((f) => {
        if (!f.nutrition || typeof f.nutrition.protein !== "number") {
          return false;
        }
        return f.nutrition.protein >= filters.protein_min!;
      });
      console.log(`After protein filter (>=${filters.protein_min}g): ${foods.length} foods`);
    }

    // Carbs maximum filter
    if (filters.carbs_max !== undefined && filters.carbs_max > 0) {
      foods = foods.filter((f) => {
        if (!f.nutrition || typeof f.nutrition.carbs !== "number") {
          return false;
        }
        return f.nutrition.carbs <= filters.carbs_max!;
      });
      console.log(`After carbs filter (<=${filters.carbs_max}g): ${foods.length} foods`);
    }

    // Vegetarian filter
    if (filters.vegetarian !== undefined) {
      foods = foods.filter((f) => f.isVegetarian === filters.vegetarian);
      console.log(`After vegetarian filter: ${foods.length} foods`);
    }

    // Spice level filter (case-insensitive exact match)
    if (filters.spiceLevel) {
      const spiceLevelLower = filters.spiceLevel.toLowerCase();
      foods = foods.filter((f) => {
        if (!f.spiceLevel) return false;
        return f.spiceLevel.toLowerCase() === spiceLevelLower;
      });
      console.log(`After spice level filter: ${foods.length} foods`);
    }

    // Price filter
    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      foods = foods.filter((f) => {
        if (typeof f.price !== "number") return false;
        return f.price <= filters.maxPrice!;
      });
      console.log(`After price filter (<= ₹${filters.maxPrice}): ${foods.length} foods`);
    }

    // If no foods remain after filtering, return empty array
    if (foods.length === 0) {
      console.log("No foods match the filters");
      return [];
    }

    // Apply Vector Similarity Search

    if (!queryEmbedding || queryEmbedding.length === 0) {
      console.warn("Empty query embedding, returning filtered results without ranking");
      return foods.slice(0, topK);
    }

    const scoredFoods: ScoredFood[] = [];

    for (const food of foods) {
      try {
        const embedding = getEmbedding(food.id);

        // Skip if embedding is missing or invalid
        if (!embedding || embedding.length === 0) {
          console.warn(`Missing embedding for food: ${food.id} (${food.name})`);
          continue;
        }

        // Verify embedding dimensions match
        if (embedding.length !== queryEmbedding.length) {
          console.warn(
            `Embedding dimension mismatch for ${food.id}: expected ${queryEmbedding.length}, got ${embedding.length}`
          );
          continue;
        }

        // Calculate cosine similarity
        const score = cosineSimilarity(queryEmbedding, embedding);

        // Skip invalid scores
        if (isNaN(score) || !isFinite(score)) {
          console.warn(`Invalid similarity score for ${food.id}`);
          continue;
        }

        scoredFoods.push({ food, score });
      } catch (error) {
        console.error(`Error processing food ${food.id}:`, error);
        continue;
      }
    }

    if (scoredFoods.length === 0) {
      console.warn("No valid embeddings found for filtered foods");
      // Return filtered foods without ranking if no embeddings available
      return foods.slice(0, topK);
    }

    // Sort by similarity score (descending)
    scoredFoods.sort((a, b) => b.score - a.score);

    console.log(
      `Top ${Math.min(topK, scoredFoods.length)} results with scores:`,
      scoredFoods.slice(0, topK).map((s) => ({
        name: s.food.name,
        score: s.score.toFixed(4),
      }))
    );

    // Return top K results
    return scoredFoods.slice(0, topK).map((s) => s.food);
  } catch (error) {
    console.error("Error in hybrid search:", error);
    throw error;
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

      // Check name match
      if (food.name.toLowerCase().includes(queryLower)) {
        score += 10;
      }

      // Check description match
      if (food.description?.toLowerCase().includes(queryLower)) {
        score += 5;
      }

      // Check ingredients match
      if (food.ingredients?.some((ing) => ing.toLowerCase().includes(queryLower))) {
        score += 3;
      }

      // Check category match
      if (food.category?.toLowerCase().includes(queryLower)) {
        score += 7;
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