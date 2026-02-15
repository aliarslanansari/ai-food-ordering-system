import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import type { Food } from "@/types";

// Backend Food type (snake_case image_url)
interface BackendFood {
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

interface FoodsResponse {
  success: boolean;
  data: BackendFood[];
  count: number;
}

// Transform backend food to frontend Food type
const transformFood = (food: BackendFood): Food => ({
  id: food.id,
  name: food.name,
  description: food.description,
  category: food.category,
  type: food.type,
  spiceLevel: food.spiceLevel,
  ingredients: food.ingredients,
  nutrition: food.nutrition,
  price: food.price,
  serves: food.serves,
  imageUrl: food.image_url,
  isVegetarian: food.isVegetarian,
});

const fetchFoods = async (): Promise<Food[]> => {
  const { data } = await api.get<FoodsResponse>("/foods");
  if (!data.success) {
    throw new Error("Failed to fetch foods");
  }
  return data.data.map(transformFood);
};

export const useFoods = () => {
  return useQuery({
    queryKey: ["foods"],
    queryFn: fetchFoods,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
