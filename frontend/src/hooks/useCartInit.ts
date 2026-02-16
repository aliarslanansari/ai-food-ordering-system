import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { useChatStore } from "@/stores/chat";
import { useCartStore } from "@/stores/cart";
import type { CartWithItems } from "@/types";

const fetchCart = async (session_id: string): Promise<CartWithItems> => {
  const response = await api.get("/cart", {
    params: { session_id },
  });
  return response.data;
};

export function useCartInit() {
  const session_id = useChatStore((state) => state.session_id);
  const setCart = useCartStore((state) => state.setCart);
  const setSessionId = useCartStore((state) => state.setSessionId);

  const { data, isSuccess } = useQuery({
    queryKey: ["cart", session_id],
    queryFn: () => fetchCart(session_id!),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (isSuccess && data) {
      setCart(data);
      // Also update the cart store's session_id if it's different
      if (data.cart?.session_id) {
        setSessionId(data.cart.session_id);
      }
    }
  }, [isSuccess, data, setCart, setSessionId]);
}
