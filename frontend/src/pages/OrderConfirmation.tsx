import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Home,
  ShoppingBag,
  Clock,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { useOrder } from "@/hooks/useOrders";
import { MessageSkeleton } from "@/components/ChatMessage";

export default function OrderConfirmationPage() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { data, isLoading, error } = useOrder(orderId || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <MessageSkeleton />
          <MessageSkeleton />
        </div>
      </div>
    );
  }

  if (error || !data?.order) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-red-600">
              Order Not Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-stone-600 text-center">
              We couldn't find the order you're looking for.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const order = data.order;
  const orderDate = new Date(order.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="min-h-screen bg-stone-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-2xl xl:max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-3 sm:mb-4">
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-800 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-stone-600 text-sm sm:text-base">
            Thank you for your order. We'll start preparing it right away.
          </p>
        </div>

        {/* Order Details Card */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              <span>Order Details</span>
              <span className="text-xs sm:text-sm font-normal text-stone-500">
                #{order.id.slice(-8).toUpperCase()}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status */}
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800 capitalize">
                  {order.status.replace(/_/g, " ")}
                </p>
                <p className="text-sm text-orange-600">
                  Estimated delivery: 30-45 minutes
                </p>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-stone-800">
                Delivery Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-stone-400 mt-0.5" />
                  <span>{order.customerName}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-stone-400 mt-0.5" />
                  <span>{order.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-stone-400 mt-0.5" />
                  <span>{order.address}</span>
                </div>
                {order.deliveryInstructions && (
                  <div className="flex items-start gap-2">
                    <span className="text-stone-500">Instructions:</span>
                    <span className="text-stone-600">
                      {order.deliveryInstructions}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div className="space-y-3">
              <h3 className="font-semibold text-stone-800">Order Items</h3>
              <div className="space-y-2">
                {order.items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b border-stone-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{item.foodName}</p>
                      <p className="text-sm text-stone-500">
                        ₹{item.price} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Paid</span>
              <span className="text-2xl font-bold text-orange-600">
                ₹{order.total.toFixed(2)}
              </span>
            </div>

            {/* Payment Method */}
            <div className="p-3 bg-stone-100 rounded-lg text-center">
              <p className="text-sm text-stone-600">
                Payment Method: <strong>Cash on Delivery</strong>
              </p>
            </div>

            {/* Order Time */}
            <p className="text-xs text-stone-400 text-center">
              Ordered on {orderDate}
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="flex-1 h-10 sm:h-11"
            size="sm"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Chat
          </Button>
          <Button
            onClick={() => navigate("/orders")}
            className="flex-1 bg-orange-600 hover:bg-orange-700 h-10 sm:h-11"
            size="sm"
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            View Orders
          </Button>
        </div>
      </div>
    </div>
  );
}
