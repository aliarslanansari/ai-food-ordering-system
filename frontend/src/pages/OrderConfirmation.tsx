import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useOrder } from "../hooks/useOrders";
import { useAuth } from "../hooks/useAuth";

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useOrder(orderId!);

  useEffect(() => {
    if (!orderId) {
      navigate("/");
    }
  }, [orderId, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header user={user} />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header user={user} />
        <div className="flex flex-1 items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="mb-4 text-slate-600">Order not found</p>
              <Button onClick={() => navigate("/")}>Go Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header user={user} />

      <div className="container-responsive flex-1 py-6">
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
            <p className="text-slate-600">
              Order ID: <strong>{data.order.id}</strong>
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 text-center">
              <p className="text-lg font-semibold">
                Total: ₹{data.order.total.toFixed(2)}
              </p>
              <p className="text-sm text-slate-600">
                Status:{" "}
                <strong className="capitalize">{data.order.status}</strong>
              </p>
              <p className="text-sm text-slate-600">
                Delivery to: {data.order.address}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Order Items</h3>
              {data.order.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between border-b pb-2 last:border-0"
                >
                  <span>
                    {item.food_name} × {item.quantity}
                  </span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Button onClick={() => navigate("/")} className="w-full">
                Continue Shopping
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/orders")}
                className="w-full"
              >
                View Order History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
