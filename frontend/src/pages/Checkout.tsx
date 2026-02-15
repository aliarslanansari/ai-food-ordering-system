import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Truck,
  CreditCard,
} from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { useChatStore } from "@/stores/chat";
import { useCreateOrder } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";

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

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.total);
  const clearCart = useCartStore((state) => state.clearCart);
  const sessionId = useChatStore((state) => state.sessionId);
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
          session_id: sessionId || undefined,
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

  // Show empty cart message after hooks are initialized
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Your Cart is Empty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-stone-600 text-center">
              Add some delicious items to your cart before checking out.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-3 sm:px-4 py-2 sm:py-3">
        <div className="max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
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
              Checkout
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl xl:max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Delivery Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-600" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={formik.handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="customerName"
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      placeholder="Enter your full name"
                      value={formik.values.customerName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={
                        formik.touched.customerName &&
                        formik.errors.customerName
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {formik.touched.customerName &&
                      formik.errors.customerName && (
                        <p className="text-sm text-red-500">
                          {formik.errors.customerName}
                        </p>
                      )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="10-digit mobile number"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={
                        formik.touched.phone && formik.errors.phone
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {formik.touched.phone && formik.errors.phone && (
                      <p className="text-sm text-red-500">
                        {formik.errors.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="address"
                      className="flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Delivery Address
                    </Label>
                    <textarea
                      id="address"
                      name="address"
                      rows={3}
                      placeholder="Enter your complete delivery address"
                      value={formik.values.address}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        formik.touched.address && formik.errors.address
                          ? "border-red-500"
                          : "border-stone-300"
                      }`}
                    />
                    {formik.touched.address && formik.errors.address && (
                      <p className="text-sm text-red-500">
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
                      placeholder="e.g., Ring the doorbell, Leave at reception"
                      value={formik.values.deliveryInstructions}
                      onChange={formik.handleChange}
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-orange-600 hover:bg-orange-700 h-11 sm:h-12 text-base sm:text-lg"
                    >
                      {isPending ? (
                        "Placing Order..."
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          Place Order - ₹{total.toFixed(2)}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="order-first lg:order-last">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] sm:h-[300px] pr-4">
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center py-2 border-b border-stone-100 last:border-0"
                      >
                        <div className="flex-1">
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
                </ScrollArea>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Subtotal</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Delivery Fee</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Taxes</span>
                    <span>Included</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-orange-600">
                    ₹{total.toFixed(2)}
                  </span>
                </div>

                <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Cash on Delivery</strong> - Pay when your order
                    arrives
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
