import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FoodCardGrid } from "./FoodCardGrid";
import { ShoppingCart, User, Bot, Loader2 } from "lucide-react";
import type { ChatMessage as ChatMessageType, Food } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
  onAddToCart: (food: Food, quantity: number) => void;
}

export function ChatMessage({ message, onAddToCart }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Text-only message
  if (!message.foods && !message.cartSummary) {
    return (
      <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
        <Avatar
          className={`h-8 w-8 ${isUser ? "bg-orange-600" : "bg-stone-600"}`}
        >
          <AvatarFallback
            className={
              isUser ? "bg-orange-600 text-white" : "bg-stone-600 text-white"
            }
          >
            {isUser ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </AvatarFallback>
        </Avatar>
        <div
          className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 ${
            isUser ? "bg-orange-600 text-white" : "bg-stone-100 text-stone-900"
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  // Message with food recommendations
  if (message.foods && message.foods.length > 0) {
    return (
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 bg-stone-600">
          <AvatarFallback className="bg-stone-600 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
          <div className="bg-stone-100 rounded-lg px-3 sm:px-4 py-2 max-w-[90%] sm:max-w-[80%]">
            <p className="text-sm">{message.content}</p>
          </div>
          <FoodCardGrid foods={message.foods} onAddToCart={onAddToCart} />
        </div>
      </div>
    );
  }

  // Cart summary message
  if (message.cartSummary && message.cartSummary.items.length > 0) {
    const cart = message.cartSummary;
    return (
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 bg-stone-600">
          <AvatarFallback className="bg-stone-600 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 max-w-[90%] sm:max-w-md">
          <div className="bg-stone-100 rounded-lg px-3 sm:px-4 py-2 mb-2 sm:mb-3">
            <p className="text-sm">{message.content}</p>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Cart Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.foodName} x{item.quantity}
                  </span>
                  <span className="font-medium">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₹{cart.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
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
