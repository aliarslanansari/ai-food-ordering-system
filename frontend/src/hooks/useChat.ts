import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useChatStore } from "@/stores/chat";
import { useCartStore } from "@/stores/cart";
import type { SendMessageInput, SearchResponse } from "@/types";
import { toast } from "sonner";
import type { AxiosError } from "axios";

const sendMessage = async (data: SendMessageInput): Promise<SearchResponse> => {
  const response = await api.post("/search", data);
  return response.data;
};

export function useChat() {
  const queryClient = useQueryClient();
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
        // Update cart with added items from server response
        data.items_added.forEach((item) => {
          addCartItem(item);
        });
        toast.success(`Added ${data.items_added.length} item(s) to cart`);
      }

      // Always update cart from server response to ensure sync
      if (data.cart) {
        setCart(data.cart);
        // Invalidate cart query to ensure consistency
        queryClient.invalidateQueries({ queryKey: ["cart", data.session_id] });
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
