import { create } from "zustand";
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
}

export const useCartStore = create<CartState>((set) => ({
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
    }),
  addItem: (item) =>
    set((state) => {
      const existingItem = state.items.find((i) => i.food_id === item.food_id);
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
      const newItems = state.items.filter((i) => i.id !== itemId);
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
}));
