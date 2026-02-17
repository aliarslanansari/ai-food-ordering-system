import mongoose, { Schema, Document } from "mongoose";

export interface ISessionContext extends Document {
  session_id: string;
  last_mentioned_items: string[];
  last_search_query: string | undefined;
  preferences: Record<string, any>;
  cart_id: string | undefined;
  updated_at: number;
}

const SessionContextSchema = new Schema<ISessionContext>({
  session_id: { type: String, required: true, unique: true },
  last_mentioned_items: { type: [String], default: [] },
  last_search_query: { type: String, default: undefined },
  preferences: { type: Schema.Types.Mixed, default: {} },
  cart_id: { type: String, default: undefined },
  updated_at: { type: Number, required: true },
});

export const SessionContextModel = mongoose.model<ISessionContext>(
  "SessionContext",
  SessionContextSchema,
);
