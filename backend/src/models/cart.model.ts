import mongoose, { Schema, Document } from "mongoose";

export interface ICart extends Document {
  id: string;
  session_id: string;
  user_id: string | null;
  created_at: number;
  updated_at: number;
}

const CartSchema = new Schema<ICart>({
  id: { type: String, required: true, unique: true },
  session_id: { type: String, required: true },
  user_id: { type: String, default: null },
  created_at: { type: Number, required: true },
  updated_at: { type: Number, required: true },
});

CartSchema.index({ user_id: 1 });

export const CartModel = mongoose.model<ICart>("Cart", CartSchema);
