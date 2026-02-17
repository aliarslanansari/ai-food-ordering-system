import { randomUUID } from "crypto";
import { OrderModel, IOrder, IOrderItem } from "../models/index.js";
import type { CartItem } from "./cart.service.js";

export interface Order {
  id: string;
  userId: string;
  sessionId?: string;
  customerName: string;
  phone: string;
  address: string;
  deliveryInstructions?: string;
  total: number;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  paymentMethod: string;
  createdAt: number;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  foodId: string;
  foodName: string;
  quantity: number;
  price: number;
}

export interface CreateOrderInput {
  userId: string;
  sessionId?: string;
  cartId: string;
  customerName: string;
  phone: string;
  address: string;
  deliveryInstructions?: string;
  items: CartItem[];
  total: number;
}

export class OrderService {
  /**
   * Create a new order from cart items
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const orderId = `order_${randomUUID()}`;
    const now = Date.now();

    const orderItems: IOrderItem[] = input.items.map((item) => ({
      id: `oi_${randomUUID()}`,
      food_id: item.food_id,
      food_name: item.food_name,
      quantity: item.quantity,
      price: item.price,
    }));

    const orderDoc = await OrderModel.create({
      id: orderId,
      user_id: input.userId,
      session_id: input.sessionId || null,
      cart_id: input.cartId,
      customer_name: input.customerName,
      phone: input.phone,
      address: input.address,
      delivery_instructions: input.deliveryInstructions || null,
      total: input.total,
      status: "pending",
      payment_method: "cod",
      created_at: now,
      items: orderItems,
    });

    return this.toOrder(orderDoc);
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order | null> {
    const orderDoc = await OrderModel.findOne({ id: orderId });
    return orderDoc ? this.toOrder(orderDoc) : null;
  }

  /**
   * Get orders by user ID
   */
  async getOrdersByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<Order[]> {
    const orderDocs = await OrderModel.find({ user_id: userId })
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit);

    return orderDocs.map((doc) => this.toOrder(doc));
  }

  /**
   * Update order status
   */
  async updateStatus(
    orderId: string,
    status: Order["status"],
  ): Promise<boolean> {
    const result = await OrderModel.updateOne(
      { id: orderId },
      { $set: { status } },
    );
    return result.modifiedCount > 0;
  }

  /**
   * Cancel order (only if pending)
   */
  async cancelOrder(orderId: string, userId: string): Promise<boolean> {
    const result = await OrderModel.updateOne(
      { id: orderId, user_id: userId, status: "pending" },
      { $set: { status: "cancelled" } },
    );
    return result.modifiedCount > 0;
  }

  /**
   * Get order statistics for a user
   */
  async getUserOrderStats(userId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    pendingOrders: number;
  }> {
    const stats = await OrderModel.aggregate([
      { $match: { user_id: userId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$total" },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
    ]);

    return {
      totalOrders: stats[0]?.totalOrders || 0,
      totalSpent: stats[0]?.totalSpent || 0,
      pendingOrders: stats[0]?.pendingOrders || 0,
    };
  }

  /**
   * Convert Mongoose document to Order interface
   */
  private toOrder(doc: IOrder): Order {
    return {
      id: doc.id,
      userId: doc.user_id,
      sessionId: doc.session_id || undefined,
      customerName: doc.customer_name,
      phone: doc.phone,
      address: doc.address,
      deliveryInstructions: doc.delivery_instructions || undefined,
      total: doc.total,
      status: doc.status,
      paymentMethod: doc.payment_method,
      createdAt: doc.created_at,
      items: doc.items.map((item) => ({
        id: item.id,
        orderId: doc.id,
        foodId: item.food_id,
        foodName: item.food_name,
        quantity: item.quantity,
        price: item.price,
      })),
    };
  }
}
