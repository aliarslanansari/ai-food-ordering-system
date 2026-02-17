import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string | null;
  created_at: number;
}

const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, default: null },
  created_at: { type: Number, required: true },
});

export const UserModel = mongoose.model<IUser>("User", UserSchema);
