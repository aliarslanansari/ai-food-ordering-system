import { Header } from "../components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { useOrders } from "../hooks/useOrders";
import { useAuth } from "../hooks/useAuth";

export default function OrderHistory() {
  const { user } = useAuth();
  const { data, isLoading } = useOrders();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header user={user} />

      <div className="container-responsive flex-1 py-6">
        <h1 className="mb-6 text-3xl font-bold">Order History</h1>

        {isLoading ? (
          <div className="text-center text-slate-600">Loading...</div>
        ) : !data?.orders || data.orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-600">No orders yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.orders.map((order: any) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.id}
                      </CardTitle>
                      <p className="text-sm text-slate-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        order.status === "delivered"
                          ? "default"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="mb-2 font-medium">Items</h4>
                      <ScrollArea className="max-h-40">
                        {order.items.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex justify-between border-b py-2 text-sm last:border-0"
                          >
                            <span>
                              {item.food_name} × {item.quantity}
                            </span>
                            <span>
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Total</span>
                      <span className="text-blue-600">
                        ₹{order.total_amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>
                        <strong>Delivery Address:</strong> {order.address}
                      </p>
                      <p>
                        <strong>Phone:</strong> {order.phone}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
