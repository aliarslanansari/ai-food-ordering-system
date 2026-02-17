import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  id: string;
  food_id: string;
  food_name: string;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  id: string;
  user_id: string;
  session_id: string | null;
  cart_id: string;
  customer_name: string;
  phone: string;
  address: string;
  delivery_instructions: string | null;
  total: number;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  payment_method: string;
  created_at: number;
  items: IOrderItem[];
}

const OrderItemSchema = new Schema<IOrderItem>({
  id: { type: String, required: true },
  food_id: { type: String, required: true },
  food_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const OrderSchema = new Schema<IOrder>({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  session_id: { type: String, default: null },
  cart_id: { type: String, required: true },
  customer_name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  delivery_instructions: { type: String, default: null },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: [
      "pending",
      "confirmed",
      "preparing",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ],
    default: "pending",
  },
  payment_method: { type: String, default: "cod" },
  created_at: { type: Number, required: true },
  items: { type: [OrderItemSchema], required: true },
});

OrderSchema.index({ user_id: 1, created_at: -1 });
OrderSchema.index({ session_id: 1 });

export const OrderModel = mongoose.model<IOrder>("Order", OrderSchema);
