import { useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/api";
import { useChatStore } from "@/stores/chat";
import { useCartStore } from "@/stores/cart";
import type { CartWithItems, CartItem } from "@/types";
import { toast } from "sonner";

const fetchCart = async (session_id: string): Promise<CartWithItems> => {
  const response = await api.get("/cart", {
    params: { session_id },
  });
  return response.data;
};

// Sync local cart items to backend
const syncLocalCartItems = async (
  session_id: string,
  localItems: CartItem[],
): Promise<CartWithItems> => {
  const response = await api.post("/cart/sync", {
    session_id,
    items: localItems.map((item) => ({
      food_id: item.food_id,
      food_name: item.food_name,
      quantity: item.quantity,
      price: item.price,
    })),
  });
  return response.data;
};

export function useCartInit() {
  const session_id = useChatStore((state) => state.session_id);
  const setCart = useCartStore((state) => state.setCart);
  const setSessionId = useCartStore((state) => state.setSessionId);
  const hasLocalItems = useCartStore((state) => state.hasLocalItems);
  const getLocalItems = useCartStore((state) => state.getLocalItems);
  const clearLocalItems = useCartStore((state) => state.clearLocalItems);
  const items = useCartStore((state) => state.items);

  // Track if we've already synced to prevent duplicate syncs
  const hasSyncedRef = useRef(false);

  // Query to fetch cart from server
  const { data, isSuccess } = useQuery({
    queryKey: ["cart", session_id],
    queryFn: () => fetchCart(session_id!),
    enabled: !!session_id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation to sync local items to backend
  const syncMutation = useMutation({
    mutationFn: ({
      session_id,
      localItems,
    }: {
      session_id: string;
      localItems: CartItem[];
    }) => syncLocalCartItems(session_id, localItems),
    onSuccess: (data) => {
      // Clear local items after successful sync
      clearLocalItems();
      // Update cart with server response
      setCart(data);
      toast.success("Cart synced successfully!");
    },
    onError: (error) => {
      console.error("Failed to sync cart:", error);
      toast.error("Failed to sync some cart items");
    },
  });

  // Effect to sync local items when session becomes available
  useEffect(() => {
    if (session_id && hasLocalItems() && !hasSyncedRef.current) {
      const localItems = getLocalItems();
      if (localItems.length > 0) {
        hasSyncedRef.current = true;
        syncMutation.mutate({ session_id, localItems });
      }
    }
  }, [session_id, hasLocalItems, getLocalItems, syncMutation, clearLocalItems]);

  // Effect to handle cart data from server
  useEffect(() => {
    if (isSuccess && data) {
      // If we have local items that weren't synced yet, merge them carefully
      const localItems = items.filter((item) => item.id.startsWith("local_"));

      if (localItems.length > 0 && !hasSyncedRef.current) {
        // Merge server items with local items
        const serverFoodIds = new Set(data.items.map((item) => item.food_id));
        const uniqueLocalItems = localItems.filter(
          (item) => !serverFoodIds.has(item.food_id),
        );

        const mergedItems = [...data.items, ...uniqueLocalItems];
        const mergedTotal = mergedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        const mergedItemCount = mergedItems.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );

        setCart({
          ...data,
          items: mergedItems,
          total: mergedTotal,
          item_count: mergedItemCount,
        });

        // Trigger sync for the unique local items
        if (uniqueLocalItems.length > 0 && session_id) {
          hasSyncedRef.current = true;
          syncMutation.mutate({ session_id, localItems: uniqueLocalItems });
        }
      } else {
        setCart(data);
      }

      // Update the cart store's session_id if it's different
      if (data.cart?.session_id) {
        setSessionId(data.cart.session_id);
      }
    }
  }, [isSuccess, data, setCart, setSessionId, items, session_id, syncMutation]);

  // Reset sync flag when session changes
  useEffect(() => {
    hasSyncedRef.current = false;
  }, [session_id]);
}
