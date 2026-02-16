import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Header } from "../components/Header";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCartStore } from "../stores/cart";
import { useChatStore } from "../stores/chat";
import { useCreateOrder } from "../hooks/useOrders";
import { useAuth } from "../hooks/useAuth";

const checkoutSchema = Yup.object({
  customerName: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Full name is required"),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
    .required("Phone number is required"),
  address: Yup.string()
    .min(10, "Address must be at least 10 characters")
    .required("Delivery address is required"),
  deliveryInstructions: Yup.string().optional(),
});

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.total);
  const clearCart = useCartStore((state) => state.clearCart);
  const session_id = useChatStore((state) => state.session_id);
  const { mutate: createOrder, isPending } = useCreateOrder();

  const formik = useFormik({
    initialValues: {
      customerName: user?.name || "",
      phone: "",
      address: "",
      deliveryInstructions: "",
    },
    validationSchema: checkoutSchema,
    onSubmit: (values) => {
      createOrder(
        {
          session_id: session_id || undefined,
          customer_name: values.customerName,
          phone: values.phone,
          address: values.address,
          delivery_instructions: values.deliveryInstructions || undefined,
        },
        {
          onSuccess: (data) => {
            clearCart();
            navigate(`/order-confirmation/${data.order.id}`);
          },
        },
      );
    },
  });

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header user={user} />
        <div className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Your cart is empty</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-slate-600">
                Add items to your cart before checking out.
              </p>
              <Button onClick={() => navigate("/")} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Chat
              </Button>
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
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={formik.handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Full Name</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    placeholder="Enter your full name"
                    value={formik.values.customerName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.customerName &&
                    formik.errors.customerName && (
                      <p className="text-sm text-red-600">
                        {formik.errors.customerName}
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="10-digit mobile number"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.phone && formik.errors.phone && (
                    <p className="text-sm text-red-600">
                      {formik.errors.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address</Label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    placeholder="Enter your complete delivery address"
                    value={formik.values.address}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  {formik.touched.address && formik.errors.address && (
                    <p className="text-sm text-red-600">
                      {formik.errors.address}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryInstructions">
                    Delivery Instructions (Optional)
                  </Label>
                  <Input
                    id="deliveryInstructions"
                    name="deliveryInstructions"
                    placeholder="e.g., Ring the doorbell"
                    value={formik.values.deliveryInstructions}
                    onChange={formik.handleChange}
                  />
                </div>

                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    `Place Order - ₹${total.toFixed(2)}`
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between border-b pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{item.food_name}</p>
                        <p className="text-sm text-slate-600">
                          ₹{item.price} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Delivery Fee</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Taxes</span>
                  <span>Included</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-blue-600">₹{total.toFixed(2)}</span>
              </div>

              <div className="mt-4 rounded-lg bg-blue-50 p-3">
                <p className="text-sm text-blue-900">
                  <strong>Cash on Delivery</strong> - Pay when your order
                  arrives
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
