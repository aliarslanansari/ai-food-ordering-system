import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import type { CartItem } from "@/types";

interface CartSidebarProps {
  items: CartItem[];
  total: number;
  itemCount: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function CartSidebar({
  items,
  total,
  itemCount,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: CartSidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart ({itemCount} items)
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
            <p>Your cart is empty</p>
            <p className="text-sm">Add items from the chat to get started</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[calc(100vh-250px)] mt-4">
              <div className="space-y-4 pr-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-medium">{item.foodName}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{item.price} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          onUpdateQuantity(
                            item.id,
                            Math.max(0, item.quantity - 1),
                          )
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
              <Separator className="mb-4" />
              <div className="flex justify-between mb-4">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClearCart}
                  className="flex-1"
                >
                  Clear
                </Button>
                <Button
                  onClick={onCheckout}
                  className="flex-[2] bg-orange-600 hover:bg-orange-700"
                >
                  Checkout
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
