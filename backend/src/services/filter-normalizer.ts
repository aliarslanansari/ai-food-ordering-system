import { getFoods } from "./data.service.js";
import { Filters } from "./retrieval.service.js";

interface RawFilters {
  category?: string | null;
  protein_level?: "high" | "medium" | "low" | null;
  carb_level?: "high" | "medium" | "low" | null;
  vegetarian?: boolean | null;
  spiceLevel?: string | null;
  budget?: number | null;
}

/**
 * Calculate statistics for normalization
 */
function calculateStats() {
  const foods = getFoods();

  if (foods.length === 0) {
    return {
      avgProtein: 20,
      avgCarbs: 40,
      medianProtein: 20,
      medianCarbs: 40,
      proteinQ1: 15,
      proteinQ3: 30,
      carbsQ1: 25,
      carbsQ3: 50,
    };
  }

  // Extract nutrition values
  const proteins = foods
    .map((f) => f.nutrition?.protein || 0)
    .filter((p) => p > 0)
    .sort((a, b) => a - b);

  const carbs = foods
    .map((f) => f.nutrition?.carbs || 0)
    .filter((c) => c > 0)
    .sort((a, b) => a - b);

  // Calculate averages
  const avgProtein = proteins.reduce((sum, p) => sum + p, 0) / proteins.length;
  const avgCarbs = carbs.reduce((sum, c) => sum + c, 0) / carbs.length;

  // Calculate quartiles for better thresholds
  const proteinQ1 = proteins[Math.floor(proteins.length * 0.25)] || avgProtein * 0.7;
  const proteinQ3 = proteins[Math.floor(proteins.length * 0.75)] || avgProtein * 1.3;
  const carbsQ1 = carbs[Math.floor(carbs.length * 0.25)] || avgCarbs * 0.7;
  const carbsQ3 = carbs[Math.floor(carbs.length * 0.75)] || avgCarbs * 1.3;

  // Calculate medians
  const medianProtein = proteins[Math.floor(proteins.length / 2)] || avgProtein;
  const medianCarbs = carbs[Math.floor(carbs.length / 2)] || avgCarbs;

  return {
    avgProtein,
    avgCarbs,
    medianProtein,
    medianCarbs,
    proteinQ1,
    proteinQ3,
    carbsQ1,
    carbsQ3,
  };
}

/**
 * Normalize raw filters from LLM into actual filter values
 * @param rawFilters - Filters extracted from user intent
 * @returns Normalized filters ready for hybrid search
 */
export function normalizeFilters(rawFilters: RawFilters = {}): Filters {
  const filters: Filters = {};
  const stats = calculateStats();

  console.log("Nutrition statistics:", {
    avgProtein: stats.avgProtein.toFixed(1),
    avgCarbs: stats.avgCarbs.toFixed(1),
    proteinQ1: stats.proteinQ1.toFixed(1),
    proteinQ3: stats.proteinQ3.toFixed(1),
    carbsQ1: stats.carbsQ1.toFixed(1),
    carbsQ3: stats.carbsQ3.toFixed(1),
  });

  // Category filter (pass through as-is)
  if (rawFilters.category && rawFilters.category.trim().length > 0) {
    filters.category = rawFilters.category.trim();
  }

  // Vegetarian filter (pass through as-is)
  if (rawFilters.vegetarian !== undefined && rawFilters.vegetarian !== null) {
    filters.vegetarian = rawFilters.vegetarian;
  }

  // Spice level filter (pass through as-is)
  if (rawFilters.spiceLevel && rawFilters.spiceLevel.trim().length > 0) {
    filters.spiceLevel = rawFilters.spiceLevel.trim();
  }

  // Budget/Price filter (pass through as-is)
  if (rawFilters.budget && rawFilters.budget > 0) {
    filters.maxPrice = rawFilters.budget;
  }

  // Protein level normalization
  // Use quartiles for better distribution
  if (rawFilters.protein_level) {
    switch (rawFilters.protein_level) {
      case "high":
        // High protein: above Q3 (75th percentile)
        filters.protein_min = Math.round(stats.proteinQ3);
        break;
      case "medium":
        // Medium protein: around median
        filters.protein_min = Math.round(stats.medianProtein);
        break;
      case "low":
        // Low protein: we typically don't filter for low protein
        // but if needed, could set a very low threshold
        // For now, we'll skip this filter
        break;
    }
  }

  // Carbs level normalization
  // Use quartiles for better distribution
  if (rawFilters.carb_level) {
    switch (rawFilters.carb_level) {
      case "low":
        // Low carbs: below Q1 (25th percentile)
        filters.carbs_max = Math.round(stats.carbsQ1);
        break;
      case "medium":
        // Medium carbs: around median
        filters.carbs_max = Math.round(stats.medianCarbs);
        break;
      case "high":
        // High carbs: we typically don't set a max for high carbs
        // but if needed, could set a high threshold
        // For now, we'll skip this filter
        break;
    }
  }

  console.log("Normalized filters:", filters);
  return filters;
}

/**
 * Get human-readable description of applied filters
 * @param filters - Normalized filters
 * @returns Human-readable string
 */
export function describeFilters(filters: Filters): string {
  const descriptions: string[] = [];

  if (filters.category) {
    descriptions.push(`Category: ${filters.category}`);
  }

  if (filters.vegetarian !== undefined) {
    descriptions.push(filters.vegetarian ? "Vegetarian only" : "Non-vegetarian included");
  }

  if (filters.spiceLevel) {
    descriptions.push(`Spice level: ${filters.spiceLevel}`);
  }

  if (filters.protein_min) {
    descriptions.push(`Protein ≥ ${filters.protein_min}g`);
  }

  if (filters.carbs_max) {
    descriptions.push(`Carbs ≤ ${filters.carbs_max}g`);
  }

  if (filters.maxPrice) {
    descriptions.push(`Price ≤ ₹${filters.maxPrice}`);
  }

  return descriptions.length > 0 
    ? descriptions.join(", ") 
    : "No filters applied";
}