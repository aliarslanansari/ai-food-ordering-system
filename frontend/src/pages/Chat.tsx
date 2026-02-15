import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { ChatMessage, TypingIndicator } from "../components/ChatMessage";
import { ChatInput } from "../components/ChatInput";
import { CartSidebar } from "../components/CartSidebar";
import { ScrollArea } from "../components/ui/scroll-area";
import { Button } from "../components/ui/button";
import { useChatStore } from "../stores/chat";
import { useCartStore } from "../stores/cart";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../hooks/useAuth";

export default function Chat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useChatStore((state) => state.messages);
  const isLoading = useChatStore((state) => state.isLoading);
  const sessionId = useChatStore((state) => state.sessionId);

  const cartItems = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.total);
  const itemCount = useCartStore((state) => state.itemCount);
  const isCartOpen = useCartStore((state) => state.isOpen);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const closeCart = useCartStore((state) => state.closeCart);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const { mutate: sendMessage, isPending } = useChat();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = (content: string) => {
    sendMessage({
      message: content,
      sessionId: sessionId || undefined,
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
    "Show me vegetarian curries",
    "High protein dishes",
    "Tandoori recommendations",
    "Budget meals under ₹500",
  ];

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <Header cartCount={itemCount} user={user} onCartClick={toggleCart} />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <ScrollArea className="flex-1">
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
                <div className="mx-auto max-w-3xl space-y-4">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onAddToCart={(food, quantity) => {
                        console.log("Add to cart:", food, quantity);
                      }}
                    />
                  ))}
                  {isLoading && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>

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
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClearCart={clearCart}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  );
}
