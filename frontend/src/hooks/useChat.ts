import { useMutation } from "@tanstack/react-query";
import { api } from "@/api";
import { useChatStore } from "@/stores/chat";
import { useCartStore } from "@/stores/cart";
import type { SendMessageInput, SearchResponse, Food } from "@/types";
import { toast } from "sonner";
import type { AxiosError } from "axios";

const sendMessage = async (data: SendMessageInput): Promise<SearchResponse> => {
  const response = await api.post("/search", data);
  return response.data;
};

export function useChat() {
  const addMessage = useChatStore((state) => state.addMessage);
  const setSessionId = useChatStore((state) => state.setSessionId);
  const setIsLoading = useChatStore((state) => state.setIsLoading);
  const addCartItem = useCartStore((state) => state.addItem);
  const setCart = useCartStore((state) => state.setCart);

  return useMutation({
    mutationFn: sendMessage,
    onMutate: (data) => {
      setIsLoading(true);
      // Add user message immediately
      addMessage({
        id: Date.now().toString(),
        role: "user",
        content: data.message,
        timestamp: Date.now(),
      });
    },
    onSuccess: (data) => {
      setIsLoading(false);

      // Save session ID
      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      // Handle different response types
      if (data.intent === "add_to_cart" && data.itemsAdded) {
        // Update cart with added items
        data.itemsAdded.forEach((item) => {
          addCartItem(item);
        });
        toast.success(`Added ${data.itemsAdded.length} item(s) to cart`);
      }

      if (data.cartSummary) {
        setCart(data.cartSummary);
      }

      // Add assistant message
      addMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        intent: data.intent,
        foods: data.results,
        cartSummary: data.cartSummary,
        timestamp: Date.now(),
      });
    },
    onError: (error: AxiosError<{ error: string }>) => {
      setIsLoading(false);
      const errorMessage =
        error.response?.data?.error || "Failed to send message";
      toast.error(errorMessage);

      // Add error message
      addMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      });
    },
  });
}

export function useAddToCart() {
  const addCartItem = useCartStore((state) => state.addItem);
  const sessionId = useChatStore((state) => state.sessionId);

  return async (food: Food, quantity: number) => {
    if (!sessionId) {
      toast.error("No active session");
      return;
    }

    try {
      const response = await api.post("/cart/items", {
        session_id: sessionId,
        food_id: food.id,
        quantity,
      });

      // Update local cart
      addCartItem({
        id: response.data.item.id,
        foodId: food.id,
        foodName: food.name,
        quantity,
        price: food.price,
        addedAt: Date.now(),
      });

      toast.success(`Added ${food.name} to cart`);
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string }>;
      toast.error(axiosError.response?.data?.error || "Failed to add to cart");
    }
  };
}
