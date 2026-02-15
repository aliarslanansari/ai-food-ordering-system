import Database from "better-sqlite3";
import { randomUUID } from "crypto";
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
  constructor(private db: Database.Database) {}

  /**
   * Create a new order from cart items
   */
  createOrder(input: CreateOrderInput): Order {
    const orderId = `order_${randomUUID()}`;
    const now = Date.now();

    // Insert order
    const orderStmt = this.db.prepare(
      `INSERT INTO orders (id, user_id, session_id, cart_id, customer_name, phone, address,
        delivery_instructions, total, status, payment_method, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    orderStmt.run(
      orderId,
      input.userId,
      input.sessionId || null,
      input.cartId,
      input.customerName,
      input.phone,
      input.address,
      input.deliveryInstructions || null,
      input.total,
      "pending",
      "cod", // Cash on delivery default
      now,
    );

    // Insert order items
    const itemStmt = this.db.prepare(
      `INSERT INTO order_items (id, order_id, food_id, food_name, quantity, price)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const orderItems: OrderItem[] = [];
    for (const item of input.items) {
      const itemId = `oi_${randomUUID()}`;
      itemStmt.run(
        itemId,
        orderId,
        item.food_id,
        item.food_name,
        item.quantity,
        item.price,
      );
      orderItems.push({
        id: itemId,
        orderId,
        foodId: item.food_id,
        foodName: item.food_name,
        quantity: item.quantity,
        price: item.price,
      });
    }

    return {
      id: orderId,
      userId: input.userId,
      sessionId: input.sessionId,
      customerName: input.customerName,
      phone: input.phone,
      address: input.address,
      deliveryInstructions: input.deliveryInstructions,
      total: input.total,
      status: "pending",
      paymentMethod: "cod",
      createdAt: now,
      items: orderItems,
    };
  }

  /**
   * Get order by ID
   */
  getOrder(orderId: string): Order | null {
    const row = this.db
      .prepare(
        `SELECT id, user_id, session_id, customer_name, phone, address, 
        delivery_instructions, total, status, payment_method, created_at
       FROM orders WHERE id = ?`,
      )
      .get(orderId) as
      | {
          id: string;
          user_id: string;
          session_id: string | null;
          customer_name: string;
          phone: string;
          address: string;
          delivery_instructions: string | null;
          total: number;
          status: string;
          payment_method: string;
          created_at: number;
        }
      | undefined;

    if (!row) return null;

    // Get order items
    const items = this.getOrderItems(orderId);

    return {
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id || undefined,
      customerName: row.customer_name,
      phone: row.phone,
      address: row.address,
      deliveryInstructions: row.delivery_instructions || undefined,
      total: row.total,
      status: row.status as Order["status"],
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
      items,
    };
  }

  /**
   * Get order items
   */
  private getOrderItems(orderId: string): OrderItem[] {
    const rows = this.db
      .prepare(
        `SELECT id, food_id, food_name, quantity, price
       FROM order_items WHERE order_id = ?`,
      )
      .all(orderId) as Array<{
      id: string;
      food_id: string;
      food_name: string;
      quantity: number;
      price: number;
    }>;

    return rows.map((row) => ({
      id: row.id,
      orderId,
      foodId: row.food_id,
      foodName: row.food_name,
      quantity: row.quantity,
      price: row.price,
    }));
  }

  /**
   * Get orders by user ID
   */
  getOrdersByUser(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Order[] {
    const rows = this.db
      .prepare(
        `SELECT id, user_id, session_id, customer_name, phone, address, 
        delivery_instructions, total, status, payment_method, created_at
       FROM orders 
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      )
      .all(userId, limit, offset) as Array<{
      id: string;
      user_id: string;
      session_id: string | null;
      customer_name: string;
      phone: string;
      address: string;
      delivery_instructions: string | null;
      total: number;
      status: string;
      payment_method: string;
      created_at: number;
    }>;

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id || undefined,
      customerName: row.customer_name,
      phone: row.phone,
      address: row.address,
      deliveryInstructions: row.delivery_instructions || undefined,
      total: row.total,
      status: row.status as Order["status"],
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
      items: this.getOrderItems(row.id),
    }));
  }

  /**
   * Update order status
   */
  updateStatus(orderId: string, status: Order["status"]): boolean {
    const result = this.db
      .prepare(`UPDATE orders SET status = ? WHERE id = ?`)
      .run(status, orderId);
    return result.changes > 0;
  }

  /**
   * Cancel order (only if pending)
   */
  cancelOrder(orderId: string, userId: string): boolean {
    const result = this.db
      .prepare(
        `UPDATE orders SET status = 'cancelled' 
       WHERE id = ? AND user_id = ? AND status = 'pending'`,
      )
      .run(orderId, userId);
    return result.changes > 0;
  }

  /**
   * Get order statistics for a user
   */
  getUserOrderStats(userId: string): {
    totalOrders: number;
    totalSpent: number;
    pendingOrders: number;
  } {
    const row = this.db
      .prepare(
        `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_spent,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders
       FROM orders 
       WHERE user_id = ?`,
      )
      .get(userId) as
      | { total_orders: number; total_spent: number; pending_orders: number }
      | undefined;

    return {
      totalOrders: row?.total_orders || 0,
      totalSpent: row?.total_spent || 0,
      pendingOrders: row?.pending_orders || 0,
    };
  }
}
