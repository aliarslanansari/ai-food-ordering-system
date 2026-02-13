import fs from "fs";
import path from "path";
import { Food } from "../types/food.js";

const __dirname = path.resolve();

const dataPath = path.join(__dirname, "src", "data", "foods.json");

let foods: Food[] = [];

export function loadFoods() {
  const raw = fs.readFileSync(dataPath, "utf-8");
  foods = JSON.parse(raw);
  console.log(`Loaded ${foods.length} food items`);
}

export function getFoods() {
  return foods;
}
