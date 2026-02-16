import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import type { CartItem } from "../types";

interface CartSidebarProps {
  items: CartItem[];
  total: number;
  itemCount: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function CartSidebar({
  items = [],
  total,
  itemCount,
  isOpen,
  onOpenChange,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: CartSidebarProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Cart ({itemCount} items)</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-slate-500">
            <ShoppingCart className="mb-4 h-16 w-16 opacity-20" />
            <p className="text-sm">Your cart is empty</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {item.food_name}
                      </p>
                      <p className="text-sm text-slate-600">
                        ₹{item.price} each
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
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
                      className="h-7 w-7 text-red-600"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4 border-t pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-blue-600">₹{total.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClearCart}
                  className="flex-1"
                >
                  Clear
                </Button>
                <Button onClick={onCheckout} className="flex-[2]">
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
