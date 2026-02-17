import { Router } from "express";
import { AuthService } from "../services/auth.service.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

// Initialize auth service
const authService = new AuthService();

/**
 * Register new user
 * POST /api/auth/register
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, phone, session_id } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        error: "Email, password, and name are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    const result = await authService.register({
      email,
      password,
      name,
      phone,
      session_id,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "Registration failed",
    });
  }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password, session_id } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const result = await authService.login({ email, password, session_id });

    res.json(result);
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({
      error: error instanceof Error ? error.message : "Login failed",
    });
  }
});

/**
 * Get current user
 * GET /api/auth/me
 * Protected route
 */
router.get("/me", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
