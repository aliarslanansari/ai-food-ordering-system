import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import type { Food } from "@/types";

interface FoodsResponse {
  success: boolean;
  data: Food[];
  count: number;
}

const fetchFoods = async (): Promise<Food[]> => {
  const { data } = await api.get<FoodsResponse>("/foods");
  if (!data.success) {
    throw new Error("Failed to fetch foods");
  }
  return data.data;
};

export const useFoods = () => {
  return useQuery({
    queryKey: ["foods"],
    queryFn: fetchFoods,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
