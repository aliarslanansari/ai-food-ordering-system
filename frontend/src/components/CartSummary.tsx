import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, CreditCard } from "lucide-react";
import type { CartSummary as CartSummaryType } from "@/types";

interface CartSummaryProps {
  cart: CartSummaryType;
  onCheckout?: () => void;
  showCheckoutButton?: boolean;
}

export function CartSummary({
  cart,
  onCheckout,
  showCheckoutButton = true,
}: CartSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Cart Summary ({cart.item_count}{" "}
          {cart.item_count === 1 ? "item" : "items"})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {!!cart?.items?.length &&
            cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-stone-700">
                  {item.food_name} x {item.quantity}
                </span>
                <span className="font-medium">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
        </div>
        <Separator />
        <div className="flex justify-between font-semibold text-sm">
          <span>Total</span>
          <span>₹{cart.total.toFixed(2)}</span>
        </div>
        {showCheckoutButton && onCheckout && (
          <Button
            onClick={onCheckout}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Proceed to Checkout
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
