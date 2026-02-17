import express from "express";
import cors from "cors";
import { DatabaseService } from "./services/database.service.js";
import { loadFoods } from "./services/data.service.js";
import { loadEmbeddings } from "./services/embedding.service.js";
import searchRoutes from "./routes/search.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import authRoutes from "./routes/auth.routes.js";
import orderRoutes from "./routes/order.routes.js";
import foodsRoutes from "./routes/foods.routes.js";

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(",") || [
  "http://localhost:5173",
  "http://localhost:3000",
];

// Initialize database
const database = DatabaseService.getInstance();

// Connect to MongoDB and start server
async function startServer() {
  try {
    console.log("=".repeat(60));
    console.log("Connecting to MongoDB...");
    console.log("=".repeat(60));

    await database.connect();
    console.log("Database ready!");

    loadFoods();
    loadEmbeddings();

    const app = express();
    const PORT = process.env.PORT || 5200;

    app.use(
      cors({
        origin: "*",
      }),
    );
    app.use(express.json());

    // Health check with database stats
    app.get("/health", async (_req, res) => {
      try {
        const stats = await database.getStats();
        res.json({
          status: "Backend running",
          database: {
            connected: true,
            stats: stats,
          },
        });
      } catch (error) {
        res.status(500).json({
          status: "Backend running",
          database: {
            connected: false,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    });

    // API routes
    app.use("/api/auth", authRoutes);
    app.use("/api/search", searchRoutes);
    app.use("/api/cart", cartRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/foods", foodsRoutes);

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port => ${PORT}`);
    });

    const shutdown = () => {
      console.log("Shutting down gracefully...");

      server.close(async () => {
        await database.close();
        process.exit(0);
      });

      setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
