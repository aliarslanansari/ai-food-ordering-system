import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  ShoppingBag,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  Truck,
} from "lucide-react";
import { useOrders, useOrderStats } from "@/hooks/useOrders";
import { MessageSkeleton } from "@/components/ChatMessage";

const STATUS_ICONS = {
  pending: Clock,
  confirmed: CheckCircle,
  preparing: Package,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const { data: ordersData, isLoading: ordersLoading } = useOrders();
  const { data: stats, isLoading: statsLoading } = useOrderStats();

  const isLoading = ordersLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <MessageSkeleton />
          <MessageSkeleton />
          <MessageSkeleton />
        </div>
      </div>
    );
  }

  const orders = ordersData?.orders || [];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-3 sm:px-4 py-2 sm:py-3 sticky top-0 z-10">
        <div className="max-w-4xl xl:max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="px-2 sm:px-3"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-stone-800">
              Order History
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl xl:max-w-5xl mx-auto p-3 sm:p-4 lg:p-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold text-orange-600">
                  {stats.totalOrders}
                </p>
                <p className="text-xs sm:text-sm text-stone-600">
                  Total Orders
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  ₹{stats.totalSpent.toFixed(0)}
                </p>
                <p className="text-xs sm:text-sm text-stone-600">Total Spent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {stats.pendingOrders}
                </p>
                <p className="text-xs sm:text-sm text-stone-600">Pending</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Orders List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
              Your Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-stone-300 mb-3 sm:mb-4" />
                <p className="text-stone-600 mb-2 text-sm sm:text-base">
                  No orders yet
                </p>
                <p className="text-xs sm:text-sm text-stone-500 mb-4">
                  Start ordering delicious food from our menu!
                </p>
                <Button
                  onClick={() => navigate("/browse")}
                  className="bg-orange-600 hover:bg-orange-700 text-sm"
                  size="sm"
                >
                  Browse Menu
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px] sm:h-[500px] lg:h-[600px]">
                <div className="space-y-3 sm:space-y-4">
                  {orders.map((order) => {
                    const StatusIcon = STATUS_ICONS[order.status];
                    return (
                      <div
                        key={order.id}
                        onClick={() =>
                          navigate(`/order-confirmation/${order.id}`)
                        }
                        className="p-3 sm:p-4 border border-stone-200 rounded-lg hover:border-orange-300 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm sm:text-base">
                              Order #{order.id.slice(-8).toUpperCase()}
                            </p>
                            <p className="text-xs sm:text-sm text-stone-500">
                              {new Date(order.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                          <Badge
                            className={`${STATUS_COLORS[order.status]} text-xs`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">
                              {order.status.replace(/_/g, " ")}
                            </span>
                            <span className="sm:hidden">
                              {order.status.replace(/_/g, " ").split(" ")[0]}
                            </span>
                          </Badge>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between items-center">
                          <p className="text-xs sm:text-sm text-stone-600">
                            {order.itemCount} item
                            {order.itemCount !== 1 ? "s" : ""}
                          </p>
                          <p className="font-bold text-base sm:text-lg">
                            ₹{order.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
