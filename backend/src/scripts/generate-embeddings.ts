import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { EMBEDDING_MODEL } from "../config/env.js";

dotenv.config();

const __dirname = path.resolve();

// Initialize Google GenAI
const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Food {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  spiceLevel: string;
  ingredients: string[];
  nutrition: Nutrition;
  price: number;
  serves: number;
  isVegetarian: boolean;
  image_url: string;
}

interface EmbeddingResult {
  id: string;
  name: string;
  embedding: number[];
  metadata?: {
    category: string;
    type: string;
    isVegetarian: boolean;
    spiceLevel: string;
    price: number;
  };
}

// Configuration
const CONFIG = {
  BATCH_SIZE: 10,
  DELAY_MS: 100,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
  EMBEDDING_MODEL: EMBEDDING_MODEL,
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create rich text representation for embedding
 */
function createEmbeddingText(food: Food): string {
  return `
Name: ${food.name}
Description: ${food.description}
Category: ${food.category}
Cuisine Type: ${food.type}
Dietary: ${food.isVegetarian ? "Vegetarian" : "Non-Vegetarian"}
Spice Level: ${food.spiceLevel}
Ingredients: ${food.ingredients.join(", ")}
Nutritional Information: ${food.nutrition.calories} calories, ${food.nutrition.protein}g protein, ${food.nutrition.carbs}g carbs, ${food.nutrition.fat}g fat per serving
Price: ₹${food.price}
Serving Size: ${food.serves} person${food.serves > 1 ? "s" : ""}
  `.trim();
}

/**
 * Generate embedding with retry logic
 */
async function generateEmbeddingWithRetry(
  food: Food,
  attempt: number = 1,
): Promise<number[]> {
  try {
    const textToEmbed = createEmbeddingText(food);

    const response = await genai.models.embedContent({
      model: CONFIG.EMBEDDING_MODEL,
      contents: [
        {
          parts: [{ text: textToEmbed }],
        },
      ],
    });

    const embedding = response.embeddings?.[0]?.values;

    if (!embedding || embedding.length === 0) {
      throw new Error("Empty embedding returned");
    }

    return embedding;
  } catch (error) {
    if (attempt < CONFIG.RETRY_ATTEMPTS) {
      console.log(
        `  Retry ${attempt}/${CONFIG.RETRY_ATTEMPTS} for ${food.name}...`,
      );
      await sleep(CONFIG.RETRY_DELAY_MS * attempt);
      return generateEmbeddingWithRetry(food, attempt + 1);
    }
    throw error;
  }
}

/**
 * Load existing embeddings to support resume functionality
 */
function loadExistingEmbeddings(outputPath: string): Set<string> {
  if (!fs.existsSync(outputPath)) {
    return new Set();
  }

  try {
    const raw = fs.readFileSync(outputPath, "utf-8");
    const existing: EmbeddingResult[] = JSON.parse(raw);
    return new Set(existing.map((e) => e.id));
  } catch (error) {
    console.warn("Could not load existing embeddings, starting fresh");
    return new Set();
  }
}

/**
 * Save embeddings incrementally
 */
function saveEmbeddings(outputPath: string, results: EmbeddingResult[]): void {
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
}

async function main() {
  const foodsPath = path.join(__dirname, "src", "data", "foods.json");
  const outputPath = path.join(__dirname, "src", "data", "embeddings.json");

  // Load foods data
  const raw = fs.readFileSync(foodsPath, "utf-8");
  const foods: Food[] = JSON.parse(raw);

  console.log(`Total foods to process: ${foods.length}`);

  // Load existing embeddings for resume capability
  const existingIds = loadExistingEmbeddings(outputPath);
  const foodsToProcess = foods.filter((f) => !existingIds.has(f.id));

  if (existingIds.size > 0) {
    console.log(`Found ${existingIds.size} existing embeddings`);
    console.log(`Remaining to process: ${foodsToProcess.length}`);
  }

  // Load existing results
  let results: EmbeddingResult[] = [];
  if (existingIds.size > 0) {
    const existingRaw = fs.readFileSync(outputPath, "utf-8");
    results = JSON.parse(existingRaw);
  }

  // Process in batches
  for (let i = 0; i < foodsToProcess.length; i += CONFIG.BATCH_SIZE) {
    const batch = foodsToProcess.slice(i, i + CONFIG.BATCH_SIZE);
    console.log(
      `\nProcessing batch ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}/${Math.ceil(foodsToProcess.length / CONFIG.BATCH_SIZE)}`,
    );

    for (const food of batch) {
      try {
        const batchIndex = batch.indexOf(food);
        const overallIndex = i + batchIndex + 1;
        console.log(
          `  [${overallIndex}/${foodsToProcess.length}] Generating embedding for: ${food.name}`,
        );

        const embedding = await generateEmbeddingWithRetry(food);

        results.push({
          id: food.id,
          name: food.name,
          embedding: embedding,
          metadata: {
            category: food.category,
            type: food.type,
            isVegetarian: food.isVegetarian,
            spiceLevel: food.spiceLevel,
            price: food.price,
          },
        });

        // Save incrementally after each successful embedding
        saveEmbeddings(outputPath, results);

        // Delay between requests
        await sleep(CONFIG.DELAY_MS);
      } catch (error) {
        console.error(
          `  ❌ Error generating embedding for ${food.name}:`,
          error,
        );
        // Save progress before continuing
        saveEmbeddings(outputPath, results);
        continue;
      }
    }
  }

  // Final save
  saveEmbeddings(outputPath, results);

  console.log(`\n✅ Embeddings generated successfully!`);
  console.log(`Total items processed: ${results.length}/${foods.length}`);
  console.log(`Output saved to: ${outputPath}`);

  // Display statistics
  const stats = {
    totalFoods: foods.length,
    totalEmbeddings: results.length,
    categories: [...new Set(results.map((r) => r.metadata?.category))],
    vegetarian: results.filter((r) => r.metadata?.isVegetarian).length,
    nonVegetarian: results.filter((r) => !r.metadata?.isVegetarian).length,
  };

  console.log("\n📊 Statistics:");
  console.log(`  Categories: ${stats.categories.join(", ")}`);
  console.log(`  Vegetarian dishes: ${stats.vegetarian}`);
  console.log(`  Non-Vegetarian dishes: ${stats.nonVegetarian}`);
}

main().catch(console.error);
