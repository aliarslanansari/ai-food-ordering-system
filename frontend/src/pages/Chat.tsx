import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessage, TypingIndicator } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { CartSidebar } from "@/components/CartSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/chat";
import { useCartStore } from "@/stores/cart";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";

export default function ChatPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messages = useChatStore((state) => state.messages);
  const isLoading = useChatStore((state) => state.isLoading);
  const sessionId = useChatStore((state) => state.sessionId);

  const cartItems = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.total);
  const itemCount = useCartStore((state) => state.itemCount);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const { mutate: sendMessage, isPending } = useChat();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
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

  return (
    <div className="flex flex-col h-screen bg-stone-50">
      {/* Header */}
      <ChatHeader itemCount={itemCount} onCartClick={() => {}} user={user} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-3 sm:p-4 lg:p-6">
            <div className="space-y-4 max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto">
              {messages.length === 0 ? (
                <div className="text-center py-8 sm:py-12 lg:py-16">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-stone-800 mb-2 sm:mb-3">
                    Welcome to SpiceRoute! 🍛
                  </h2>
                  <p className="text-stone-600 mb-4 sm:mb-6 text-sm sm:text-base">
                    Your AI-powered Indian food ordering assistant
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-md mx-auto px-2 sm:px-0">
                    <button
                      onClick={() =>
                        handleSendMessage(
                          "Show me some spicy vegetarian curries",
                        )
                      }
                      className="p-2.5 sm:p-3 text-left bg-white rounded-lg border border-stone-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                    >
                      <span className="text-xs sm:text-sm text-stone-700 line-clamp-2">
                        "Show me some spicy vegetarian curries"
                      </span>
                    </button>
                    <button
                      onClick={() =>
                        handleSendMessage("I want something high protein")
                      }
                      className="p-2.5 sm:p-3 text-left bg-white rounded-lg border border-stone-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                    >
                      <span className="text-xs sm:text-sm text-stone-700 line-clamp-2">
                        "I want something high protein"
                      </span>
                    </button>
                    <button
                      onClick={() =>
                        handleSendMessage("Recommend tandoori dishes")
                      }
                      className="p-2.5 sm:p-3 text-left bg-white rounded-lg border border-stone-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                    >
                      <span className="text-xs sm:text-sm text-stone-700 line-clamp-2">
                        "Recommend tandoori dishes"
                      </span>
                    </button>
                    <button
                      onClick={() =>
                        handleSendMessage("What's good for under ₹500?")
                      }
                      className="p-2.5 sm:p-3 text-left bg-white rounded-lg border border-stone-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
                    >
                      <span className="text-xs sm:text-sm text-stone-700 line-clamp-2">
                        "What's good for under ₹500?"
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onAddToCart={(food, quantity) => {
                        // Handle add to cart from food cards
                        console.log("Add to cart:", food, quantity);
                      }}
                    />
                  ))}
                  {isLoading && <TypingIndicator />}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 sm:p-4 lg:p-6 border-t border-stone-200 bg-white">
            <div className="max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto">
              <ChatInput
                onSend={handleSendMessage}
                isLoading={isPending}
                placeholder="Ask for recommendations, add items to cart, or checkout..."
              />
            </div>
          </div>
        </div>

        {/* Cart Sidebar */}
        <CartSidebar
          items={cartItems}
          total={cartTotal}
          itemCount={itemCount}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClearCart={clearCart}
          onCheckout={handleCheckout}
        />
      </div>
    </div>
  );
}
