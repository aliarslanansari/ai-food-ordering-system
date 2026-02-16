import { Router } from "express";
import { DatabaseService } from "../services/database.service.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { OrderService } from "../services/order.service.js";
import { CartService } from "../services/cart.service.js";
import type { Request, Response } from "express";

const router = Router();

// Initialize services
const db = DatabaseService.getInstance().getDb();
const orderService = new OrderService(db);
const cartService = new CartService(db);

/**
 * POST /api/orders - Create a new order from cart
 * Requires authentication
 */
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { session_id, customer_name, phone, address, delivery_instructions } =
      req.body;

    // Validate required fields
    if (!customer_name || !phone || !address) {
      res.status(400).json({
        error: "Missing required fields: customer_name, phone, address",
      });
      return;
    }

    // Get cart for this session/user
    const cart = session_id
      ? cartService.getCartBySession(session_id)
      : cartService.getCartByUser(userId);

    if (!cart) {
      res.status(400).json({ error: "No cart found" });
      return;
    }

    // Get cart items
    const items = cartService.getCartItems(cart.id);
    if (items.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    // Calculate total
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Create order
    const order = orderService.createOrder({
      userId,
      sessionId: session_id,
      cartId: cart.id,
      customerName: customer_name,
      phone,
      address,
      deliveryInstructions: delivery_instructions,
      items,
      total,
    });

    // Clear the cart after successful order
    cartService.clearCart(cart.id);

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        deliveryInstructions: order.deliveryInstructions,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          foodName: item.foodName,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

/**
 * GET /api/orders - Get user's order history
 * Requires authentication
 */
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const orders = orderService.getOrdersByUser(userId, limit, offset);

    res.json({
      orders: orders.map((order) => ({
        id: order.id,
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        itemCount: order.items.length,
        items: order.items.map((item) => ({
          id: item.id,
          food_name: item.foodName,
          quantity: item.quantity,
          price: item.price,
        })),
      })),
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * GET /api/orders/stats - Get user's order statistics
 * Requires authentication
 */
router.get("/stats", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = orderService.getUserOrderStats(userId);

    res.json(stats);
  } catch (error) {
    console.error("Error fetching order stats:", error);
    res.status(500).json({ error: "Failed to fetch order statistics" });
  }
});

/**
 * GET /api/orders/:orderId - Get order details
 * Requires authentication
 */
router.get(
  "/:orderId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const orderId = req.params.orderId as string;

      const order = orderService.getOrder(orderId);

      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      // Ensure user can only access their own orders
      if (order.userId !== userId) {
        res.status(403).json({ error: "Unauthorized access to order" });
        return;
      }

      res.json({
        order: {
          id: order.id,
          customerName: order.customerName,
          phone: order.phone,
          address: order.address,
          deliveryInstructions: order.deliveryInstructions,
          total: order.total,
          status: order.status,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            foodName: item.foodName,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  },
);

/**
 * POST /api/orders/:orderId/cancel - Cancel an order
 * Requires authentication
 */
router.post(
  "/:orderId/cancel",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const orderId = req.params.orderId as string;

      const order = orderService.getOrder(orderId);

      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      if (order.userId !== userId) {
        res.status(403).json({ error: "Unauthorized access to order" });
        return;
      }

      if (order.status !== "pending") {
        res.status(400).json({
          error: `Cannot cancel order with status: ${order.status}. Only pending orders can be cancelled.`,
        });
        return;
      }

      const success = orderService.cancelOrder(orderId, userId);

      if (success) {
        res.json({ success: true, message: "Order cancelled successfully" });
      } else {
        res.status(400).json({ error: "Failed to cancel order" });
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      res.status(500).json({ error: "Failed to cancel order" });
    }
  },
);

export default router;
