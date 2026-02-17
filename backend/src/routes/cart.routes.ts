import { Router } from "express";
import { getFoods } from "../services/data.service.js";
import { CartService, type CartWithItems } from "../services/cart.service.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const router = Router();

const cartService = new CartService();

router.get("/", optionalAuth, async (req, res) => {
  try {
    const { session_id } = req.query;
    const userId = req.user?.id;

    if ((!session_id || typeof session_id !== "string") && !userId) {
      return res
        .status(400)
        .json({ error: "session_id or authentication required" });
    }

    let cartWithItems: CartWithItems | null = null;

    // Priority 1: Try to get cart by session_id (for guest users or to link session)
    if (session_id && typeof session_id === "string") {
      cartWithItems = await cartService.getCartWithItems(session_id, userId);
    }

    // Priority 2: If no cart by session and user is logged in, try to get by user_id
    // This handles cross-device scenarios where session_id differs but user is same
    if (!cartWithItems && userId) {
      const userCart = await cartService.getCartByUser(userId);
      if (userCart) {
        // Update the cart's session_id to link it to current session
        if (session_id && typeof session_id === "string") {
          await cartService.linkCartToSession(userCart.id, session_id);
        }
        const items = await cartService.getCartItems(userCart.id);
        const total = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        cartWithItems = { cart: userCart, items, total, item_count: itemCount };
      }
    }

    if (!cartWithItems) {
      const emptyCart =
        session_id && typeof session_id === "string"
          ? await cartService.getOrCreateCart(session_id, userId)
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

    const foods = getFoods();
    const food = foods.find((f) => f.id === food_id);

    if (!food) {
      return res.status(404).json({ error: "Food item not found" });
    }

    const cart = await cartService.getOrCreateCart(session_id, req.user?.id);

    const item = await cartService.addItem({
      cart_id: cart.id,
      session_id,
      user_id: req.user?.id,
      food_id: food.id,
      food_name: food.name,
      quantity,
      price: food.price,
    });

    const cartWithItems = await cartService.getCartWithItems(
      session_id,
      req.user?.id,
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
 * Sync local cart items to backend
 * POST /api/cart/sync
 */
router.post("/sync", optionalAuth, async (req, res) => {
  try {
    const { session_id, items } = req.body;
    const userId = req.user?.id;

    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({ error: "session_id required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items array required" });
    }

    const foods = getFoods();
    const cart = await cartService.getOrCreateCart(session_id, userId);
    const addedItems = [];

    for (const item of items) {
      // Validate the food item exists
      const food = foods.find((f) => f.id === item.food_id);
      if (!food) {
        console.warn(`Food item not found during sync: ${item.food_id}`);
        continue;
      }

      const addedItem = await cartService.addItem({
        cart_id: cart.id,
        session_id,
        user_id: userId,
        food_id: item.food_id,
        food_name: item.food_name || food.name,
        quantity: item.quantity || 1,
        price: item.price || food.price,
      });
      addedItems.push(addedItem);
    }

    const cartWithItems = await cartService.getCartWithItems(
      session_id,
      userId,
    );

    res.json({
      message: `Synced ${addedItems.length} items to cart`,
      items_added: addedItems,
      cart: cartWithItems,
    });
  } catch (error) {
    console.error("Error syncing cart:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to sync cart",
    });
  }
});

router.put("/items/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== "number" || quantity < 1) {
      return res
        .status(400)
        .json({ error: "quantity must be a positive number" });
    }

    const item = await cartService.updateItemQuantity(itemId, quantity);

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

router.delete("/items/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;

    await cartService.removeItem(itemId);

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

router.delete("/", async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({ error: "session_id required" });
    }

    const cart = await cartService.getCartBySession(session_id);

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    await cartService.clearCart(cart.id);

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

router.get("/summary", async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({ error: "session_id required" });
    }

    const summary = await cartService.getCartSummary(session_id, req.user?.id);

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
