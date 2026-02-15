import { create } from "zustand";
import type { CartItem, CartWithItems } from "@/types";

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  sessionId: string | null;
  setCart: (cart: CartWithItems) => void;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setSessionId: (sessionId: string) => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  total: 0,
  itemCount: 0,
  sessionId: null,
  setCart: (cart) =>
    set({
      items: cart.items,
      total: cart.total,
      itemCount: cart.itemCount,
    }),
  addItem: (item) =>
    set((state) => {
      const existingItem = state.items.find((i) => i.foodId === item.foodId);
      let newItems;
      if (existingItem) {
        newItems = state.items.map((i) =>
          i.foodId === item.foodId
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
        itemCount: newItemCount,
      };
    }),
  removeItem: (itemId) =>
    set((state) => {
      const newItems = state.items.filter((i) => i.id !== itemId);
      const newTotal = newItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0,
      );
      const newItemCount = newItems.reduce((sum, i) => sum + i.quantity, 0);
      return {
        items: newItems,
        total: newTotal,
        itemCount: newItemCount,
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
        itemCount: newItemCount,
      };
    }),
  clearCart: () =>
    set({
      items: [],
      total: 0,
      itemCount: 0,
    }),
  setSessionId: (sessionId) => set({ sessionId }),
}));
