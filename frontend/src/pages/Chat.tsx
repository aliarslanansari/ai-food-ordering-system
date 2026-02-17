import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { ChatMessage, TypingIndicator } from "../components/ChatMessage";
import { ChatInput } from "../components/ChatInput";
import { CartSidebar } from "../components/CartSidebar";
import { Button } from "../components/ui/button";
import { useChatStore } from "../stores/chat";
import { useCartStore } from "../stores/cart";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";
import {
  useAddToCart,
  useUpdateCartQuantity,
  useRemoveFromCart,
  useClearCart,
} from "../hooks/useCart";

export default function Chat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useChatStore((state) => state.messages);
  console.log({ messages });
  const isLoading = useChatStore((state) => state.isLoading);
  const session_id = useChatStore((state) => state.session_id);

  const cartItems = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.total);
  const itemCount = useCartStore((state) => state.item_count);
  const isCartOpen = useCartStore((state) => state.isOpen);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const closeCart = useCartStore((state) => state.closeCart);

  const { mutate: sendMessage, isPending } = useChat();
  const addToCart = useAddToCart();
  const updateQuantityMutation = useUpdateCartQuantity();
  const removeItemMutation = useRemoveFromCart();
  const clearCartMutation = useClearCart();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = (content: string) => {
    sendMessage({
      message: content,
      session_id: session_id || undefined,
    });
  };

  const handleCheckout = () => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    navigate("/checkout");
  };

  const suggestedPrompts = [
    "Show me some spicy appetizers under ₹300",
    "High protein dishes",
    "Tandoori recommendations",
    "Budget meals under ₹500",
  ];

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <Header cartCount={itemCount} user={user} onCartClick={toggleCart} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="container-responsive py-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-4xl text-white shadow-lg">
                    🍛
                  </div>
                  <h1 className="mb-2 text-3xl font-bold text-slate-900">
                    Welcome to SpiceRoute
                  </h1>
                  <p className="mb-8 text-slate-600">
                    Your AI-powered Indian food ordering assistant
                  </p>
                  <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                    {suggestedPrompts.map((prompt) => (
                      <Button
                        key={prompt}
                        variant="outline"
                        className="h-auto whitespace-normal p-4 text-left"
                        onClick={() => handleSendMessage(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-3xl space-y-4 pb-4">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onAddToCart={(food, quantity) =>
                        addToCart.mutate({ food, quantity })
                      }
                      onCheckout={handleCheckout}
                    />
                  ))}
                  {isLoading && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          <div className="border-t bg-white p-4">
            <div className="container-responsive">
              <div className="mx-auto max-w-3xl">
                <ChatInput
                  onSend={handleSendMessage}
                  isLoading={isPending}
                  placeholder="Ask for recommendations, add items to cart..."
                />
              </div>
            </div>
          </div>
        </div>

        <CartSidebar
          items={cartItems}
          total={cartTotal}
          itemCount={itemCount}
          isOpen={isCartOpen}
          onOpenChange={closeCart}
          onUpdateQuantity={(itemId, quantity) =>
            updateQuantityMutation.mutate({ itemId, quantity })
          }
          onRemoveItem={(itemId) => removeItemMutation.mutate(itemId)}
          onClearCart={() => clearCartMutation.mutate()}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  );
}
