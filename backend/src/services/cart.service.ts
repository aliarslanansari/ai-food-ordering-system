import { randomUUID } from "crypto";
import { CartModel, CartItemModel, ICart, ICartItem } from "../models/index.js";

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
  // ============================================================
  // Cart Management
  // ============================================================

  /**
   * Get or create cart for a session
   */
  async getOrCreateCart(sessionId: string, userId?: string): Promise<Cart> {
    // Try to get existing cart
    let cart = await this.getCartBySession(sessionId);

    // If user is logged in, try to get their user cart
    if (!cart && userId) {
      cart = await this.getCartByUser(userId);
    }

    if (!cart) {
      // Create new cart
      cart = await this.createCart(sessionId, userId);
      console.log(
        `✅ Cart created: ${cart.id} for session: ${sessionId}${userId ? `, user: ${userId}` : ""}`,
      );
    }

    return cart;
  }

  /**
   * Create a new cart
   */
  private async createCart(sessionId: string, userId?: string): Promise<Cart> {
    const now = Date.now();
    const cartDoc = await CartModel.create({
      id: randomUUID(),
      session_id: sessionId,
      user_id: userId || null,
      created_at: now,
      updated_at: now,
    });

    return this.toCart(cartDoc);
  }

  /**
   * Get cart by user ID
   */
  async getCartByUser(userId: string): Promise<Cart | null> {
    const cartDoc = await CartModel.findOne({ user_id: userId }).sort({
      updated_at: -1,
    });
    return cartDoc ? this.toCart(cartDoc) : null;
  }

  /**
   * Link cart to user
   */
  async linkCartToUser(cartId: string, userId: string): Promise<boolean> {
    const result = await CartModel.updateOne(
      { id: cartId },
      { $set: { user_id: userId } },
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Cart ${cartId} linked to user ${userId}`);
      return true;
    }

    return false;
  }

  /**
   * Link cart to session (for cross-device cart persistence)
   */
  async linkCartToSession(cartId: string, sessionId: string): Promise<boolean> {
    const result = await CartModel.updateOne(
      { id: cartId },
      { $set: { session_id: sessionId, updated_at: Date.now() } },
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Cart ${cartId} linked to session ${sessionId}`);
      return true;
    }

    return false;
  }

  /**
   * Merge guest cart items into user cart
   * Returns the merged cart with items
   * Handles cross-device scenarios where sessionId may differ from user's existing cart
   */
  async mergeCarts(
    sessionId: string,
    userId: string,
  ): Promise<CartWithItems | null> {
    // Get guest cart by session (current device/session)
    const guestCart = await this.getCartBySession(sessionId);

    // Get user's existing cart (may be from different device)
    let userCart = await this.getCartByUser(userId);

    // Case 1: No guest cart exists
    if (!guestCart) {
      if (userCart) {
        // User has existing cart from another device - link current session to it
        await this.linkCartToSession(userCart.id, sessionId);
        console.log(
          `✅ Linked existing user cart ${userCart.id} to new session ${sessionId}`,
        );
      }
      // Return user's cart (existing or empty)
      return this.getCartWithItems(sessionId, userId);
    }

    // Get guest cart items
    const guestItems = await this.getCartItems(guestCart.id);

    // Case 2: Guest cart exists but is empty
    if (guestItems.length === 0) {
      if (userCart && userCart.id !== guestCart.id) {
        // Delete empty guest cart and link to user cart
        await this.deleteCart(guestCart.id);
        await this.linkCartToSession(userCart.id, sessionId);
      } else if (!userCart) {
        // Convert empty guest cart to user cart
        await CartModel.updateOne(
          { id: guestCart.id },
          { $set: { user_id: userId } },
        );
      }
      return this.getCartWithItems(sessionId, userId);
    }

    // Case 3: Guest cart has items
    if (!userCart) {
      // No existing user cart - convert guest cart to user cart
      await CartModel.updateOne(
        { id: guestCart.id },
        { $set: { user_id: userId, session_id: sessionId } },
      );

      console.log(`✅ Guest cart ${guestCart.id} linked to user ${userId}`);

      return this.getCartWithItems(sessionId, userId);
    }

    // Case 4: Both guest cart and user cart exist - need to merge
    // Don't merge if they're the same cart
    if (userCart.id === guestCart.id) {
      await CartModel.updateOne(
        { id: userCart.id },
        { $set: { user_id: userId, session_id: sessionId } },
      );
      return this.getCartWithItems(sessionId, userId);
    }

    // User has an existing cart - merge guest items into user cart
    const userItems = await this.getCartItems(userCart.id);

    // Merge guest items into user cart
    for (const guestItem of guestItems) {
      const existingItem = userItems.find(
        (item) => item.food_id === guestItem.food_id,
      );

      if (existingItem) {
        // Update quantity of existing item
        const newQuantity = existingItem.quantity + guestItem.quantity;
        await this.updateItemQuantity(existingItem.id, newQuantity);
      } else {
        // Move item from guest cart to user cart
        await CartItemModel.updateOne(
          { id: guestItem.id },
          { $set: { cart_id: userCart.id } },
        );
      }
    }

    // Delete guest cart (items are either moved or already updated)
    await this.deleteCart(guestCart.id);

    // Update user cart timestamp and session
    await CartModel.updateOne(
      { id: userCart.id },
      { $set: { session_id: sessionId, updated_at: Date.now() } },
    );

    console.log(
      `✅ Merged ${guestItems.length} items from guest cart to user ${userId}'s cart`,
    );

    // Return merged cart
    const items = await this.getCartItems(userCart.id);
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      cart: userCart,
      items,
      total,
      item_count: itemCount,
    };
  }

  /**
   * Get cart by session ID
   */
  async getCartBySession(sessionId: string): Promise<Cart | null> {
    const cartDoc = await CartModel.findOne({ session_id: sessionId }).sort({
      updated_at: -1,
    });
    return cartDoc ? this.toCart(cartDoc) : null;
  }

  /**
   * Get cart by cart ID
   */
  async getCart(cartId: string): Promise<Cart | null> {
    const cartDoc = await CartModel.findOne({ id: cartId });
    return cartDoc ? this.toCart(cartDoc) : null;
  }

  /**
   * Update cart timestamp
   */
  private async touchCart(cartId: string): Promise<void> {
    await CartModel.updateOne(
      { id: cartId },
      { $set: { updated_at: Date.now() } },
    );
  }

  /**
   * Delete cart (and all items via pre-delete hook or manual cleanup)
   */
  async deleteCart(cartId: string): Promise<void> {
    await CartItemModel.deleteMany({ cart_id: cartId });
    await CartModel.deleteOne({ id: cartId });
    console.log(`✅ Cart deleted: ${cartId}`);
  }

  // ============================================================
  // Cart Items Management
  // ============================================================

  /**
   * Add item to cart (or update quantity if exists)
   */
  async addItem(input: AddToCartInput): Promise<CartItem> {
    // Get or create cart
    const cart = await this.getOrCreateCart(input.session_id);

    // Check if item already exists in cart
    const existingItem = await this.getItemByFoodId(cart.id, input.food_id);

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + input.quantity;
      return this.updateItemQuantity(existingItem.id, newQuantity);
    }

    // Add new item
    const itemDoc = await CartItemModel.create({
      id: randomUUID(),
      cart_id: cart.id,
      food_id: input.food_id,
      food_name: input.food_name,
      quantity: input.quantity,
      price: input.price,
      added_at: Date.now(),
    });

    // Update cart timestamp
    await this.touchCart(cart.id);

    console.log(
      `✅ Item added to cart: ${itemDoc.food_name} x${itemDoc.quantity}`,
    );
    return this.toCartItem(itemDoc);
  }

  /**
   * Get item by food ID in a specific cart
   */
  private async getItemByFoodId(
    cartId: string,
    foodId: string,
  ): Promise<CartItem | null> {
    const itemDoc = await CartItemModel.findOne({
      cart_id: cartId,
      food_id: foodId,
    });
    return itemDoc ? this.toCartItem(itemDoc) : null;
  }

  /**
   * Get all items in a cart
   */
  async getCartItems(cartId: string): Promise<CartItem[]> {
    const itemDocs = await CartItemModel.find({ cart_id: cartId }).sort({
      added_at: 1,
    });
    return itemDocs.map((doc) => this.toCartItem(doc));
  }

  /**
   * Get cart with all items and totals
   */
  async getCartWithItems(
    sessionId: string,
    userId?: string,
  ): Promise<CartWithItems | null> {
    const cart = await this.getOrCreateCart(sessionId, userId);

    if (!cart) {
      return null;
    }

    const items = await this.getCartItems(cart.id);
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
  async updateItemQuantity(
    itemId: string,
    quantity: number,
  ): Promise<CartItem> {
    if (quantity < 1) {
      throw new Error("Quantity must be at least 1");
    }

    const itemDoc = await CartItemModel.findOneAndUpdate(
      { id: itemId },
      { $set: { quantity } },
      { new: true },
    );

    if (!itemDoc) {
      throw new Error("Item not found");
    }

    // Update cart timestamp
    await this.touchCart(itemDoc.cart_id);

    console.log(`✅ Item quantity updated: ${itemDoc.food_name} → ${quantity}`);

    return this.toCartItem(itemDoc);
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string): Promise<void> {
    const itemDoc = await CartItemModel.findOne({ id: itemId });

    if (!itemDoc) {
      throw new Error("Item not found");
    }

    await CartItemModel.deleteOne({ id: itemId });

    // Update cart timestamp
    await this.touchCart(itemDoc.cart_id);

    console.log(`✅ Item removed from cart: ${itemDoc.food_name}`);
  }

  /**
   * Clear all items from cart
   */
  async clearCart(cartId: string): Promise<void> {
    const result = await CartItemModel.deleteMany({ cart_id: cartId });

    // Update cart timestamp
    await this.touchCart(cartId);

    console.log(`✅ Cart cleared: ${result.deletedCount} items removed`);
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  /**
   * Get cart summary
   */
  async getCartSummary(
    sessionId: string,
    userId?: string,
  ): Promise<{
    has_cart: boolean;
    item_count: number;
    total: number;
  }> {
    const cartWithItems = await this.getCartWithItems(sessionId, userId);

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
  async isCartEmpty(cartId: string): Promise<boolean> {
    const count = await CartItemModel.countDocuments({ cart_id: cartId });
    return count === 0;
  }

  /**
   * Get total items in cart
   */
  async getCartItemCount(cartId: string): Promise<number> {
    const result = await CartItemModel.aggregate([
      { $match: { cart_id: cartId } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);
    return result[0]?.total || 0;
  }

  /**
   * Get cart total price
   */
  async getCartTotal(cartId: string): Promise<number> {
    const result = await CartItemModel.aggregate([
      { $match: { cart_id: cartId } },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$price", "$quantity"] } },
        },
      },
    ]);
    return result[0]?.total || 0;
  }

  // ============================================================
  // Helpers
  // ============================================================

  private toCart(doc: ICart): Cart {
    return {
      id: doc.id,
      session_id: doc.session_id,
      user_id: doc.user_id || undefined,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    };
  }

  private toCartItem(doc: ICartItem): CartItem {
    return {
      id: doc.id,
      cart_id: doc.cart_id,
      food_id: doc.food_id,
      food_name: doc.food_name,
      quantity: doc.quantity,
      price: doc.price,
      added_at: doc.added_at,
    };
  }
}
