import fs from "fs";
import path from "path";
import { Food } from "../types/food.js";
import { buildImageUrl } from "../utils/common.js";
import { IMAGE_CDN_URL } from "../config/env.js";

const __dirname = path.resolve();

const dataPath = path.join(__dirname, "src", "data", "foods.json");

let foods: Food[] = [];

export function loadFoods() {
  const raw = fs.readFileSync(dataPath, "utf-8");
  foods = JSON.parse(raw);
  console.log(`Loaded ${foods.length} food items`);
}

/**
 * Transform food data by prepending CDN URL to image_url
 */
function transformFoodsWithImageUrls(foods: Food[]): Food[] {
  return foods.map((food) => ({
    ...food,
    image_url: buildImageUrl(food.image_url, IMAGE_CDN_URL),
  }));
}

export function getFoods(): Food[] {
  return transformFoodsWithImageUrls(foods);
}
