import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  id: string;
  user_id: string | undefined;
  created_at: number;
  last_message_at: number;
  metadata: Record<string, any>;
}

const SessionSchema = new Schema<ISession>({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, default: undefined },
  created_at: { type: Number, required: true },
  last_message_at: { type: Number, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
});

SessionSchema.index({ user_id: 1 });
SessionSchema.index({ last_message_at: 1 });

export const SessionModel = mongoose.model<ISession>("Session", SessionSchema);
