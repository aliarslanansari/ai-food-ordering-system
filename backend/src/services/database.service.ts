import mongoose from "mongoose";
import {
  UserModel,
  SessionModel,
  MessageModel,
  CartModel,
  CartItemModel,
  OrderModel,
} from "../models/index.js";
import { MONGODB_URI } from "../config/env.js";

export class DatabaseService {
  private static instance: DatabaseService;
  private connectionString: string;

  private constructor(connectionString: string) {
    this.connectionString = connectionString;
    console.log(`Database service initialized`);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      const connString = MONGODB_URI;
      DatabaseService.instance = new DatabaseService(connString);
    }
    return DatabaseService.instance;
  }

  public async connect(): Promise<void> {
    try {
      await mongoose.connect(this.connectionString);
      console.log("✅ MongoDB connected successfully via Mongoose");
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  public getConnection(): typeof mongoose.connection {
    return mongoose.connection;
  }

  public async close(): Promise<void> {
    await mongoose.disconnect();
    console.log("✅ Database connection closed");
  }

  public async cleanupOldSessions(daysOld: number = 7): Promise<number> {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const result = await SessionModel.deleteMany({
      last_message_at: { $lt: cutoffTime },
    });
    return result.deletedCount || 0;
  }

  public async getStats(): Promise<{
    sessions: number;
    messages: number;
    carts: number;
    cartItems: number;
    orders: number;
    users: number;
  }> {
    const [sessions, messages, carts, cartItems, orders, users] =
      await Promise.all([
        SessionModel.countDocuments(),
        MessageModel.countDocuments(),
        CartModel.countDocuments(),
        CartItemModel.countDocuments(),
        OrderModel.countDocuments(),
        UserModel.countDocuments(),
      ]);

    return {
      sessions,
      messages,
      carts,
      cartItems,
      orders,
      users,
    };
  }
}

// Export singleton instance getter
export const getDatabase = () => DatabaseService.getInstance();
