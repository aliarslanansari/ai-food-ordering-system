import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        phone: string | null;
      };
    }
  }
}

// Initialize auth service once
const authService = new AuthService();

/**
 * Middleware to authenticate JWT token
 * Adds user to request if authenticated
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const userId = authService.verifyToken(token);
    const user = await authService.getUserById(userId);

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

/**
 * Middleware to optionally authenticate (for routes that work with or without auth)
 * Does not return error if no token provided
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    // No token, continue as guest
    next();
    return;
  }

  try {
    const userId = authService.verifyToken(token);
    const user = await authService.getUserById(userId);

    if (user) {
      req.user = user;
    }

    next();
  } catch {
    // Invalid token, continue as guest
    next();
  }
}
