import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/api";
import type { CreateOrderInput, Order } from "@/types";
import { toast } from "sonner";

// API functions
const createOrder = async (
  data: CreateOrderInput,
): Promise<{ order: Order }> => {
  const response = await api.post("/orders", data);
  return response.data;
};

const getOrders = async (): Promise<{ orders: Order[] }> => {
  const response = await api.get("/orders");
  return response.data;
};

const getOrder = async (orderId: string): Promise<{ order: Order }> => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

const getOrderStats = async (): Promise<{
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
}> => {
  const response = await api.get("/orders/stats");
  return response.data;
};

// Hooks
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orderStats"] });
      toast.success("Order placed successfully!");
      return data;
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Failed to create order");
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: ["orderStats"],
    queryFn: getOrderStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
