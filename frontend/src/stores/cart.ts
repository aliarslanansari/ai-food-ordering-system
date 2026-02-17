import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartWithItems } from "@/types";

interface CartState {
  items: CartItem[];
  total: number;
  item_count: number;
  session_id: string | null;
  isOpen: boolean;
  setCart: (cart: CartWithItems) => void;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setSessionId: (session_id: string) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  // Local cart sync helpers
  hasLocalItems: () => boolean;
  getLocalItems: () => CartItem[];
  clearLocalItems: () => void;
  syncLocalItemIds: (serverItems: CartItem[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      item_count: 0,
      session_id: null,
      isOpen: false,
      setCart: (cart) =>
        set({
          items: cart.items,
          total: cart.total,
          item_count: cart.item_count,
          session_id: cart.cart?.session_id || get().session_id,
        }),
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.food_id === item.food_id,
          );
          let newItems;
          if (existingItem) {
            newItems = state.items.map((i) =>
              i.food_id === item.food_id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i,
            );
          } else {
            newItems = [...state.items, item];
          }
          const newTotal = newItems.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0,
          );
          const newItemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
          return {
            items: newItems,
            total: newTotal,
            item_count: newItemCount,
          };
        }),
      removeItem: (itemId) =>
        set((state) => {
          const newItems = state.items?.filter((i) => i.id !== itemId) || [];
          const newTotal = newItems.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0,
          );
          const newItemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
          return {
            items: newItems,
            total: newTotal,
            item_count: newItemCount,
          };
        }),
      updateQuantity: (itemId, quantity) =>
        set((state) => {
          const newItems = state.items.map((i) =>
            i.id === itemId ? { ...i, quantity } : i,
          );
          const newTotal = newItems.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0,
          );
          const newItemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
          return {
            items: newItems,
            total: newTotal,
            item_count: newItemCount,
          };
        }),
      clearCart: () =>
        set({
          items: [],
          total: 0,
          item_count: 0,
        }),
      setSessionId: (session_id) => set({ session_id }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      // Local cart helpers
      hasLocalItems: () => {
        const state = get();
        return state.items.some((item) => item.id.startsWith("local_"));
      },
      getLocalItems: () => {
        const state = get();
        return state.items.filter((item) => item.id.startsWith("local_"));
      },
      clearLocalItems: () =>
        set((state) => {
          const serverItems = state.items.filter(
            (item) => !item.id.startsWith("local_"),
          );
          const newTotal = serverItems.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0,
          );
          const newItemCount = serverItems.reduce(
            (sum, i) => sum + i.quantity,
            0,
          );
          return {
            items: serverItems,
            total: newTotal,
            item_count: newItemCount,
          };
        }),
      syncLocalItemIds: (serverItems) =>
        set((state) => {
          // Remove local items that are now in server items
          const nonLocalItems = state.items.filter(
            (item) => !item.id.startsWith("local_"),
          );
          // Add server items that aren't already in the cart
          const existingFoodIds = new Set(nonLocalItems.map((i) => i.food_id));
          const newServerItems = serverItems.filter(
            (item) => !existingFoodIds.has(item.food_id),
          );
          const mergedItems = [...nonLocalItems, ...newServerItems];
          const newTotal = mergedItems.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0,
          );
          const newItemCount = mergedItems.reduce(
            (sum, i) => sum + i.quantity,
            0,
          );
          return {
            items: mergedItems,
            total: newTotal,
            item_count: newItemCount,
          };
        }),
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({
        items: state.items,
        total: state.total,
        item_count: state.item_count,
        session_id: state.session_id,
      }),
    },
  ),
);
