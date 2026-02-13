export interface Food {
  id: string;
  name: string;
  description: string;
  category: string;
  type: "Vegetarian" | "Non-Vegetarian";
  spiceLevel: string;
  ingredients: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  price: number;
  serves: number;
  image_url: string;
  isVegetarian: boolean;
}
