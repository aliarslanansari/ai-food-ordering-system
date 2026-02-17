import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FoodCardGrid } from "./FoodCardGrid";
import { CartSummary } from "./CartSummary";
import { User, Bot, Loader2, CreditCard } from "lucide-react";
import type { ChatMessage as ChatMessageType, Food } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
  onAddToCart: (food: Food, quantity: number) => void;
  onCheckout?: () => void;
}

export function ChatMessage({
  message,
  onAddToCart,
  onCheckout,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  // User messages - always render as text bubble
  if (isUser) {
    return (
      <div className="flex gap-3 flex-row-reverse">
        <Avatar className="h-8 w-8 bg-orange-600">
          <AvatarFallback className="bg-orange-600 text-white">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex justify-end">
          <div className="max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 bg-orange-600 text-white">
            <p className="text-sm whitespace-pre-line">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  // Add to cart intent: show message, cart summary with checkout button, and followup
  if (message.intent === "add_to_cart" && message.cartSummary) {
    const cart = message.cartSummary;
    return (
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 bg-stone-600">
          <AvatarFallback className="bg-stone-600 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 max-w-[90%] sm:max-w-md space-y-2">
          <div className="bg-stone-100 rounded-lg px-3 sm:px-4 py-2">
            <p className="text-sm">{message.content}</p>
          </div>
          <CartSummary
            cart={cart}
            onCheckout={onCheckout}
            showCheckoutButton={true}
          />
          {message.followUpQuestion && (
            <div className="bg-stone-100 rounded-lg px-3 sm:px-4 py-2">
              <p className="text-sm">{message.followUpQuestion}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Checkout intent: show cart summary with checkout button
  if (message.intent === "checkout" && message.cartSummary) {
    return (
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 bg-stone-600">
          <AvatarFallback className="bg-stone-600 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 max-w-[90%] sm:max-w-md space-y-2">
          <div className="bg-stone-100 rounded-lg px-3 sm:px-4 py-2">
            <p className="text-sm whitespace-pre-line">{message.content}</p>
          </div>
          <CartSummary
            cart={message.cartSummary}
            onCheckout={onCheckout}
            showCheckoutButton={true}
          />
          {message.followUpQuestion && (
            <div className="bg-stone-100 rounded-lg px-3 sm:px-4 py-2">
              <p className="text-sm">{message.followUpQuestion}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Checkout intent without cart summary (fallback)
  if (message.intent === "checkout") {
    return (
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 bg-stone-600">
          <AvatarFallback className="bg-stone-600 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="bg-stone-100 rounded-lg px-3 sm:px-4 py-2 max-w-[90%] sm:max-w-[80%]">
            <p className="text-sm whitespace-pre-line">{message.content}</p>
          </div>
          {onCheckout && (
            <Button
              onClick={onCheckout}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Proceed to Checkout
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Message with food recommendations (including compound requests)
  if (message.foods && message.foods.length > 0) {
    return (
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 bg-stone-600">
          <AvatarFallback className="bg-stone-600 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
          <div
            className={`rounded-lg px-3 sm:px-4 py-2 max-w-[90%] sm:max-w-[80%] ${
              message.requiresDisambiguation
                ? "bg-orange-50 border border-orange-200"
                : "bg-stone-100"
            }`}
          >
            <p className="text-sm whitespace-pre-line">{message.content}</p>
          </div>
          <FoodCardGrid
            foods={message.foods}
            onAddToCart={onAddToCart}
            columns={2}
          />
          {/* Secondary results for compound requests */}
          {message.secondaryFoods && message.secondaryFoods.length > 0 && (
            <>
              <div className="bg-stone-100 rounded-lg px-3 sm:px-4 py-2 max-w-[90%] sm:max-w-[80%]">
                <p className="text-sm font-medium">You might also like:</p>
              </div>
              <FoodCardGrid
                foods={message.secondaryFoods}
                onAddToCart={onAddToCart}
                columns={2}
              />
            </>
          )}
          {message.followUpQuestion && (
            <div className="bg-stone-100 rounded-lg px-3 sm:px-4 py-2 max-w-[90%] sm:max-w-[80%]">
              <p className="text-sm">{message.followUpQuestion}</p>
            </div>
          )}
          {message.showCheckoutButton && onCheckout && (
            <Button
              onClick={onCheckout}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Proceed to Checkout
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Text-only assistant message
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 bg-stone-600">
        <AvatarFallback className="bg-stone-600 text-white">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 bg-stone-100 text-stone-900">
          <p className="text-sm whitespace-pre-line">{message.content}</p>
        </div>
        {message.showCheckoutButton && onCheckout && (
          <Button
            onClick={onCheckout}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Proceed to Checkout
          </Button>
        )}
      </div>
    </div>
  );
}

// Typing indicator component
export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 bg-stone-600">
        <AvatarFallback className="bg-stone-600 text-white">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-stone-100 rounded-lg px-4 py-3 flex items-center gap-1">
        <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
        <span className="text-sm text-stone-500">Thinking...</span>
      </div>
    </div>
  );
}

// Loading skeleton for messages
export function MessageSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
