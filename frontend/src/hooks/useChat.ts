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

      console.log("useChat", { data });

      // Save session ID
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      // Handle different response types
      if (data.intent === "add_to_cart" && data.items_added) {
        // Update cart with added items
        data.items_added.forEach((item) => {
          addCartItem(item);
        });
        toast.success(`Added ${data.items_added.length} item(s) to cart`);
      }

      if (data.cart) {
        setCart(data.cart);
      }

      // Add assistant message
      addMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        intent: data.intent,
        foods: data.results,
        cartSummary: data.cart_summary,
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
  const session_id = useChatStore((state) => state.session_id);

  return async (food: Food, quantity: number) => {
    if (!session_id) {
      toast.error("No active session");
      return;
    }

    try {
      const response = await api.post("/cart/items", {
        session_id: session_id,
        food_id: food.id,
        quantity,
      });

      // Update local cart
      addCartItem({
        id: response.data.item.id,
        food_id: food.id,
        food_name: food.name,
        quantity,
        price: food.price,
        added_at: Date.now(),
      });

      toast.success(`Added ${food.name} to cart`);
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string }>;
      toast.error(axiosError.response?.data?.error || "Failed to add to cart");
    }
  };
}
