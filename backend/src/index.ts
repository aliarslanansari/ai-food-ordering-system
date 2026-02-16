import express from "express";
import cors from "cors";
import { DatabaseService } from "./services/database.service.js";
import path from "path";
import { fileURLToPath } from "url";
import { loadFoods } from "./services/data.service.js";
import { loadEmbeddings } from "./services/embedding.service.js";
import searchRoutes from "./routes/search.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import authRoutes from "./routes/auth.routes.js";
import orderRoutes from "./routes/order.routes.js";
import foodsRoutes from "./routes/foods.routes.js";

// Get proper __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(",") || [
  "http://localhost:5173",
  "http://localhost:3000",
];

// CRITICAL: Initialize database ONCE with the correct path
const dbPath = path.join(__dirname, "..", "app.db");

console.log("=".repeat(60));
console.log("Initializing database at:", dbPath);
console.log("=".repeat(60));

const database = DatabaseService.getInstance(dbPath);

// Give database a moment to initialize fully
await new Promise((resolve) => setTimeout(resolve, 200));

// Now get stats
try {
  const stats = database.getStats();
  console.log("✅ Database ready!");
  console.log("📊 Statistics:", stats);
} catch (error) {
  console.error("❌ Error getting database stats:", error);
  process.exit(1);
}

console.log("=".repeat(60));

// Load data
console.log("Loading food data...");
loadFoods();
loadEmbeddings();
console.log("✅ Data loaded!");

const app = express();
const PORT = process.env.PORT || 5200;

// CORS configuration
console.log({ corsOrigins });
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// Health check with database stats
app.get("/health", (_req, res) => {
  try {
    const stats = database.getStats();
    res.json({
      status: "Backend running",
      database: {
        connected: true,
        path: dbPath,
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
app.use("/api/auth", authRoutes); // NEW - Auth routes
app.use("/api/search", searchRoutes);
app.use("/api/cart", cartRoutes); // NEW - Cart routes
app.use("/api/orders", orderRoutes); // NEW - Order routes
app.use("/api/foods", foodsRoutes); // NEW - Foods routes

// Start server
const server = app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`💾 Database: ${dbPath}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`� Search: http://localhost:${PORT}/api/search`);
  console.log(`🛒 Cart: http://localhost:${PORT}/api/cart`);
  console.log("=".repeat(60));
});

// Graceful shutdown
const shutdown = () => {
  console.log("\n" + "=".repeat(60));
  console.log("Shutting down gracefully...");
  console.log("=".repeat(60));

  server.close(() => {
    console.log("✅ HTTP server closed");
    database.close();
    console.log("✅ Database connection closed");
    console.log("👋 Goodbye!");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("⚠️  Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
