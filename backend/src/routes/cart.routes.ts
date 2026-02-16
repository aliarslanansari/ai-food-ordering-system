import { Router } from "express";
import { DatabaseService } from "../services/database.service.js";
import { getFoods } from "../services/data.service.js";
import { CartService, type CartWithItems } from "../services/cart.service.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Initialize cart service
const db = DatabaseService.getInstance().getDb();
const cartService = new CartService(db);

/**
 * Get cart for session
 * GET /api/cart?session_id=xxx
 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { session_id } = req.query;
    const userId = req.user?.id;

    // Require either session_id or authenticated user
    if ((!session_id || typeof session_id !== "string") && !userId) {
      return res
        .status(400)
        .json({ error: "session_id or authentication required" });
    }

    let cartWithItems: CartWithItems | null = null;

    if (session_id && typeof session_id === "string") {
      // Get cart by session_id (with user context if available)
      cartWithItems = cartService.getCartWithItems(session_id, userId);
    } else if (userId) {
      // Get cart by user_id only (no session_id provided)
      const cart = cartService.getCartByUser(userId);
      if (cart) {
        const items = cartService.getCartItems(cart.id);
        const total = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        cartWithItems = { cart, items, total, item_count: itemCount };
      }
    }

    // If no cart found, return empty cart response
    if (!cartWithItems) {
      // Create a minimal empty cart response
      const emptyCart =
        session_id && typeof session_id === "string"
          ? cartService.getOrCreateCart(session_id, userId)
          : null;

      return res.json({
        cart: emptyCart || {
          id: "",
          session_id: session_id || "",
          user_id: userId,
          created_at: Date.now(),
          updated_at: Date.now(),
        },
        items: [],
        total: 0,
        item_count: 0,
        message: "Cart is empty",
      });
    }

    res.json(cartWithItems);
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get cart",
    });
  }
});

/**
 * Add item to cart
 * POST /api/cart/items
 * Body: { session_id, food_id, quantity }
 */
router.post("/items", optionalAuth, async (req, res) => {
  try {
    const { session_id, food_id, quantity = 1 } = req.body;

    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({ error: "session_id required" });
    }

    if (!food_id || typeof food_id !== "string") {
      return res.status(400).json({ error: "food_id required" });
    }

    if (typeof quantity !== "number" || quantity < 1) {
      return res
        .status(400)
        .json({ error: "quantity must be a positive number" });
    }

    // Get food details
    const foods = getFoods();
    const food = foods.find((f) => f.id === food_id);

    if (!food) {
      return res.status(404).json({ error: "Food item not found" });
    }

    // Get or create cart with user context
    const cart = cartService.getOrCreateCart(session_id, req.user?.id);

    // Add to cart
    const item = cartService.addItem({
      cart_id: cart.id,
      session_id,
      user_id: req.user?.id,
      food_id: food.id,
      food_name: food.name,
      quantity,
      price: food.price,
    });

    // Get updated cart
    const cartWithItems = cartService.getCartWithItems(
      session_id,
      req.user?.id!,
    );

    res.json({
      message: `Added ${food.name} x${quantity} to cart`,
      item,
      cart: cartWithItems,
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to add to cart",
    });
  }
});

/**
 * Update item quantity
 * PUT /api/cart/items/:itemId
 * Body: { quantity }
 */
router.put("/items/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== "number" || quantity < 1) {
      return res
        .status(400)
        .json({ error: "quantity must be a positive number" });
    }

    const item = cartService.updateItemQuantity(itemId, quantity);

    res.json({
      message: `Updated quantity to ${quantity}`,
      item,
    });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update item",
    });
  }
});

/**
 * Remove item from cart
 * DELETE /api/cart/items/:itemId
 */
router.delete("/items/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;

    cartService.removeItem(itemId);

    res.json({
      message: "Item removed from cart",
      item_id: itemId,
    });
  } catch (error) {
    console.error("Error removing item:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to remove item",
    });
  }
});

/**
 * Clear cart
 * DELETE /api/cart?session_id=xxx
 */
router.delete("/", async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({ error: "session_id required" });
    }

    const cart = cartService.getCartBySession(session_id);

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cartService.clearCart(cart.id);

    res.json({
      message: "Cart cleared",
      session_id,
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to clear cart",
    });
  }
});

/**
 * Get cart summary
 * GET /api/cart/summary?session_id=xxx
 */
router.get("/summary", async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({ error: "session_id required" });
    }

    const summary = cartService.getCartSummary(session_id, req.user?.id!);

    res.json(summary);
  } catch (error) {
    console.error("Error getting cart summary:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to get cart summary",
    });
  }
});

export default router;
