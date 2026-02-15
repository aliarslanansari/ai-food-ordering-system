import Database from "better-sqlite3";
import { randomUUID } from "crypto";

// ============================================================
// Type Definitions
// ============================================================

export interface Cart {
  id: string;
  session_id: string;
  user_id?: string;
  created_at: number;
  updated_at: number;
}

export interface CartItem {
  id: string;
  cart_id: string;
  food_id: string;
  food_name: string;
  quantity: number;
  price: number;
  added_at: number;
}

export interface CartWithItems {
  cart: Cart;
  items: CartItem[];
  total: number;
  item_count: number;
}

export interface AddToCartInput {
  cart_id?: string;
  session_id: string;
  user_id?: string;
  food_id: string;
  food_name: string;
  quantity: number;
  price: number;
}

// ============================================================
// Cart Service
// ============================================================

export class CartService {
  constructor(private db: Database.Database) {}

  // ============================================================
  // Cart Management
  // ============================================================

  /**
   * Get or create cart for a session
   */
  getOrCreateCart(sessionId: string, userId?: string): Cart {
    // Try to get existing cart
    let cart = this.getCartBySession(sessionId);

    // If user is logged in, try to get their user cart
    if (!cart && userId) {
      cart = this.getCartByUser(userId);
    }

    if (!cart) {
      // Create new cart
      cart = this.createCart(sessionId, userId);
      console.log(
        `✅ Cart created: ${cart.id} for session: ${sessionId}${userId ? `, user: ${userId}` : ""}`,
      );
    }

    return cart;
  }

  /**
   * Create a new cart
   */
  private createCart(sessionId: string, userId?: string): Cart {
    const cart: Cart = {
      id: randomUUID(),
      session_id: sessionId,
      user_id: userId,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    const stmt = this.db.prepare(`
      INSERT INTO carts (id, session_id, user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      cart.id,
      cart.session_id,
      cart.user_id || null,
      cart.created_at,
      cart.updated_at,
    );

    return cart;
  }

  /**
   * Get cart by user ID
   */
  getCartByUser(userId: string): Cart | null {
    const stmt = this.db.prepare(`
      SELECT * FROM carts WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1
    `);

    const row = stmt.get(userId) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      session_id: row.session_id,
      user_id: row.user_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Link cart to user
   */
  linkCartToUser(cartId: string, userId: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE carts SET user_id = ? WHERE id = ?
    `);

    const result = stmt.run(userId, cartId);

    if (result.changes > 0) {
      console.log(`✅ Cart ${cartId} linked to user ${userId}`);
      return true;
    }

    return false;
  }

  /**
   * Get cart by session ID
   */
  getCartBySession(sessionId: string): Cart | null {
    const stmt = this.db.prepare(`
      SELECT * FROM carts WHERE session_id = ? ORDER BY updated_at DESC LIMIT 1
    `);

    const row = stmt.get(sessionId) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      session_id: row.session_id,
      user_id: row.user_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Get cart by cart ID
   */
  getCart(cartId: string): Cart | null {
    const stmt = this.db.prepare(`
      SELECT * FROM carts WHERE id = ?
    `);

    const row = stmt.get(cartId) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      session_id: row.session_id,
      user_id: row.user_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Update cart timestamp
   */
  private touchCart(cartId: string): void {
    const stmt = this.db.prepare(`
      UPDATE carts SET updated_at = ? WHERE id = ?
    `);

    stmt.run(Date.now(), cartId);
  }

  /**
   * Delete cart (and all items via CASCADE)
   */
  deleteCart(cartId: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM carts WHERE id = ?
    `);

    stmt.run(cartId);
    console.log(`✅ Cart deleted: ${cartId}`);
  }

  // ============================================================
  // Cart Items Management
  // ============================================================

  /**
   * Add item to cart (or update quantity if exists)
   */
  addItem(input: AddToCartInput): CartItem {
    // Get or create cart
    const cart = this.getOrCreateCart(input.session_id);

    // Check if item already exists in cart
    const existingItem = this.getItemByFoodId(cart.id, input.food_id);

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + input.quantity;
      return this.updateItemQuantity(existingItem.id, newQuantity);
    }

    // Add new item
    const item: CartItem = {
      id: randomUUID(),
      cart_id: cart.id,
      food_id: input.food_id,
      food_name: input.food_name,
      quantity: input.quantity,
      price: input.price,
      added_at: Date.now(),
    };

    const stmt = this.db.prepare(`
      INSERT INTO cart_items (id, cart_id, food_id, food_name, quantity, price, added_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      item.id,
      item.cart_id,
      item.food_id,
      item.food_name,
      item.quantity,
      item.price,
      item.added_at,
    );

    // Update cart timestamp
    this.touchCart(cart.id);

    console.log(`✅ Item added to cart: ${item.food_name} x${item.quantity}`);
    return item;
  }

  /**
   * Get item by food ID in a specific cart
   */
  private getItemByFoodId(cartId: string, foodId: string): CartItem | null {
    const stmt = this.db.prepare(`
      SELECT * FROM cart_items 
      WHERE cart_id = ? AND food_id = ?
    `);

    const row = stmt.get(cartId, foodId) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      cart_id: row.cart_id,
      food_id: row.food_id,
      food_name: row.food_name,
      quantity: row.quantity,
      price: row.price,
      added_at: row.added_at,
    };
  }

  /**
   * Get all items in a cart
   */
  getCartItems(cartId: string): CartItem[] {
    const stmt = this.db.prepare(`
      SELECT * FROM cart_items 
      WHERE cart_id = ? 
      ORDER BY added_at ASC
    `);

    const rows = stmt.all(cartId) as any[];

    return rows.map((row) => ({
      id: row.id,
      cart_id: row.cart_id,
      food_id: row.food_id,
      food_name: row.food_name,
      quantity: row.quantity,
      price: row.price,
      added_at: row.added_at,
    }));
  }

  /**
   * Get cart with all items and totals
   */
  getCartWithItems(sessionId: string): CartWithItems | null {
    const cart = this.getCartBySession(sessionId);

    if (!cart) {
      return null;
    }

    const items = this.getCartItems(cart.id);
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      cart,
      items,
      total,
      item_count: itemCount,
    };
  }

  /**
   * Update item quantity
   */
  updateItemQuantity(itemId: string, quantity: number): CartItem {
    if (quantity < 1) {
      throw new Error("Quantity must be at least 1");
    }

    const stmt = this.db.prepare(`
      UPDATE cart_items 
      SET quantity = ? 
      WHERE id = ?
    `);

    stmt.run(quantity, itemId);

    // Get updated item
    const getStmt = this.db.prepare(`
      SELECT * FROM cart_items WHERE id = ?
    `);

    const row = getStmt.get(itemId) as any;

    // Update cart timestamp
    this.touchCart(row.cart_id);

    console.log(`✅ Item quantity updated: ${row.food_name} → ${quantity}`);

    return {
      id: row.id,
      cart_id: row.cart_id,
      food_id: row.food_id,
      food_name: row.food_name,
      quantity: row.quantity,
      price: row.price,
      added_at: row.added_at,
    };
  }

  /**
   * Remove item from cart
   */
  removeItem(itemId: string): void {
    // Get item first to update cart
    const getStmt = this.db.prepare(`
      SELECT cart_id, food_name FROM cart_items WHERE id = ?
    `);

    const row = getStmt.get(itemId) as any;

    if (!row) {
      throw new Error("Item not found");
    }

    // Delete item
    const deleteStmt = this.db.prepare(`
      DELETE FROM cart_items WHERE id = ?
    `);

    deleteStmt.run(itemId);

    // Update cart timestamp
    this.touchCart(row.cart_id);

    console.log(`✅ Item removed from cart: ${row.food_name}`);
  }

  /**
   * Clear all items from cart
   */
  clearCart(cartId: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM cart_items WHERE cart_id = ?
    `);

    const result = stmt.run(cartId);

    // Update cart timestamp
    this.touchCart(cartId);

    console.log(`✅ Cart cleared: ${result.changes} items removed`);
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  /**
   * Get cart summary
   */
  getCartSummary(sessionId: string): {
    has_cart: boolean;
    item_count: number;
    total: number;
  } {
    const cartWithItems = this.getCartWithItems(sessionId);

    if (!cartWithItems) {
      return {
        has_cart: false,
        item_count: 0,
        total: 0,
      };
    }

    return {
      has_cart: true,
      item_count: cartWithItems.item_count,
      total: cartWithItems.total,
    };
  }

  /**
   * Check if cart is empty
   */
  isCartEmpty(cartId: string): boolean {
    const items = this.getCartItems(cartId);
    return items.length === 0;
  }

  /**
   * Get total items in cart
   */
  getCartItemCount(cartId: string): number {
    const stmt = this.db.prepare(`
      SELECT SUM(quantity) as total FROM cart_items WHERE cart_id = ?
    `);

    const result = stmt.get(cartId) as any;
    return result?.total || 0;
  }

  /**
   * Get cart total price
   */
  getCartTotal(cartId: string): number {
    const stmt = this.db.prepare(`
      SELECT SUM(price * quantity) as total FROM cart_items WHERE cart_id = ?
    `);

    const result = stmt.get(cartId) as any;
    return result?.total || 0;
  }
}
