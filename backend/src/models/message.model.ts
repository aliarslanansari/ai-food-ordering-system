import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  intent: string | undefined;
  filters: Record<string, any> | undefined;
  results: any[] | undefined;
  timestamp: number;
}

const MessageSchema = new Schema<IMessage>({
  id: { type: String, required: true, unique: true },
  session_id: { type: String, required: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  intent: { type: String, default: undefined },
  filters: { type: Schema.Types.Mixed, default: undefined },
  results: { type: [Schema.Types.Mixed], default: undefined },
  timestamp: { type: Number, required: true },
});

MessageSchema.index({ session_id: 1, timestamp: 1 });
MessageSchema.index({ timestamp: 1 });

export const MessageModel = mongoose.model<IMessage>("Message", MessageSchema);
