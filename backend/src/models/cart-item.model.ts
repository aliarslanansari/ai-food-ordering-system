import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem extends Document {
  id: string;
  cart_id: string;
  food_id: string;
  food_name: string;
  quantity: number;
  price: number;
  added_at: number;
}

const CartItemSchema = new Schema<ICartItem>({
  id: { type: String, required: true, unique: true },
  cart_id: { type: String, required: true },
  food_id: { type: String, required: true },
  food_name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  added_at: { type: Number, required: true },
});

CartItemSchema.index({ cart_id: 1 });
CartItemSchema.index({ food_id: 1 });

export const CartItemModel = mongoose.model<ICartItem>(
  "CartItem",
  CartItemSchema,
);
