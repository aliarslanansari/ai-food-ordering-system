import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useCartStore } from "@/stores/cart";
import { useChatStore } from "@/stores/chat";
import type { Food } from "@/types";
import { toast } from "sonner";
import type { AxiosError } from "axios";

// API function to add item
const addItemApi = async ({
  session_id,
  food_id,
  quantity,
}: {
  session_id: string;
  food_id: string;
  quantity: number;
}) => {
  const response = await api.post("/cart/items", {
    session_id,
    food_id,
    quantity,
  });
  return response.data;
};

// API function to update quantity
const updateQuantityApi = async ({
  itemId,
  quantity,
}: {
  itemId: string;
  quantity: number;
}) => {
  const response = await api.put(`/cart/items/${itemId}`, {
    quantity,
  });
  return response.data;
};

// API function to remove item
const removeItemApi = async (itemId: string) => {
  const response = await api.delete(`/cart/items/${itemId}`);
  return response.data;
};

// API function to clear cart
const clearCartApi = async (session_id: string) => {
  const response = await api.delete("/cart", {
    params: { session_id },
  });
  return response.data;
};

// Hook for adding item to cart
export function useAddToCart() {
  const queryClient = useQueryClient();
  const addCartItem = useCartStore((state) => state.addItem);
  const session_id = useChatStore((state) => state.session_id);

  return useMutation({
    mutationFn: async ({
      food,
      quantity,
    }: {
      food: Food;
      quantity: number;
    }) => {
      if (!session_id) {
        throw new Error("No active session");
      }
      const data = await addItemApi({ session_id, food_id: food.id, quantity });
      return { ...data, food };
    },
    onSuccess: (data) => {
      // Update local cart state
      addCartItem({
        id: data.item.id,
        food_id: data.food.id,
        food_name: data.food.name,
        quantity: data.item.quantity,
        price: data.food.price,
        added_at: Date.now(),
      });
      // Invalidate cart query to refresh from server
      queryClient.invalidateQueries({ queryKey: ["cart", session_id] });
      toast.success(`Added ${data.food.name} to cart`);
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Failed to add to cart");
    },
  });
}

// Hook for updating item quantity
export function useUpdateCartQuantity() {
  const queryClient = useQueryClient();
  const updateCartQuantity = useCartStore((state) => state.updateQuantity);
  const session_id = useChatStore((state) => state.session_id);

  return useMutation({
    mutationFn: async ({
      itemId,
      quantity,
    }: {
      itemId: string;
      quantity: number;
    }) => {
      if (quantity <= 0) {
        // If quantity is 0 or less, remove the item
        await removeItemApi(itemId);
        return { itemId, quantity: 0, removed: true };
      }
      const data = await updateQuantityApi({ itemId, quantity });
      return { ...data, removed: false };
    },
    onSuccess: (data, variables) => {
      if (data.removed) {
        // Item was removed
        const removeItem = useCartStore.getState().removeItem;
        removeItem(variables.itemId);
        toast.success("Item removed from cart");
      } else {
        // Quantity was updated
        updateCartQuantity(variables.itemId, variables.quantity);
        toast.success("Quantity updated");
      }
      // Invalidate cart query
      if (session_id) {
        queryClient.invalidateQueries({ queryKey: ["cart", session_id] });
      }
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Failed to update quantity");
    },
  });
}

// Hook for removing item from cart
export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const removeCartItem = useCartStore((state) => state.removeItem);
  const session_id = useChatStore((state) => state.session_id);

  return useMutation({
    mutationFn: async (itemId: string) => {
      await removeItemApi(itemId);
      return itemId;
    },
    onSuccess: (itemId) => {
      removeCartItem(itemId);
      toast.success("Item removed from cart");
      // Invalidate cart query
      if (session_id) {
        queryClient.invalidateQueries({ queryKey: ["cart", session_id] });
      }
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Failed to remove item");
    },
  });
}

// Hook for clearing cart
export function useClearCart() {
  const queryClient = useQueryClient();
  const clearCartStore = useCartStore((state) => state.clearCart);
  const session_id = useChatStore((state) => state.session_id);

  return useMutation({
    mutationFn: async () => {
      if (!session_id) {
        throw new Error("No active session");
      }
      await clearCartApi(session_id);
    },
    onSuccess: () => {
      clearCartStore();
      toast.success("Cart cleared");
      // Invalidate cart query
      queryClient.invalidateQueries({ queryKey: ["cart", session_id] });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || "Failed to clear cart");
    },
  });
}
