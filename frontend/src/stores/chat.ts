import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage } from "@/types";

interface ChatState {
  messages: ChatMessage[];
  session_id: string | null;
  isLoading: boolean;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
  setSessionId: (session_id: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  clearSession: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      session_id: null,
      isLoading: false,
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
      setMessages: (messages) => set({ messages }),
      clearMessages: () => set({ messages: [], session_id: null }),
      setSessionId: (session_id) => set({ session_id }),
      setIsLoading: (isLoading) => set({ isLoading }),
      clearSession: () => set({ session_id: null, messages: [] }),
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ session_id: state.session_id }),
    },
  ),
);
