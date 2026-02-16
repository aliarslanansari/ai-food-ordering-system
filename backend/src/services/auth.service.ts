import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import type Database from "better-sqlite3";
import { JWT_SECRET } from "../config/env.js";
import { CartService, type CartWithItems } from "./cart.service.js";

// ============================================================
// Types
// ============================================================

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string | null;
  created_at: number;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  created_at: number;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
  cart?: CartWithItems;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  session_id?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  session_id?: string;
}

// ============================================================
// Auth Service
// ============================================================

export class AuthService {
  private cartService: CartService;

  constructor(private db: Database.Database) {
    this.cartService = new CartService(db);
  }

  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = this.db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(input.email);

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create user
    const userId = randomUUID();
    const now = Date.now();

    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, name, phone, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      userId,
      input.email,
      passwordHash,
      input.name,
      input.phone || null,
      now,
    );

    // Get created user
    const user = this.db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(userId) as User;

    // Generate JWT
    const token = this.generateToken(user);

    // Merge cart if session_id provided
    let cart: CartWithItems | undefined;
    if (input.session_id) {
      cart = this.cartService.mergeCarts(input.session_id, userId) || undefined;
    }

    return {
      user: this.toUserResponse(user),
      token,
      cart,
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    // Find user by email
    const user = this.db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(input.email) as User | undefined;

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isValid = await bcrypt.compare(input.password, user.password_hash);

    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT
    const token = this.generateToken(user);

    // Merge cart if session_id provided
    let cart: CartWithItems | undefined;
    if (input.session_id) {
      cart =
        this.cartService.mergeCarts(input.session_id, user.id) || undefined;
    }

    return {
      user: this.toUserResponse(user),
      token,
      cart,
    };
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): UserResponse | null {
    const user = this.db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(userId) as User | undefined;

    return user ? this.toUserResponse(user) : null;
  }

  /**
   * Verify JWT token and return user ID
   */
  verifyToken(token: string): string {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch {
      throw new Error("Invalid token");
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: User): string {
    return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  }

  /**
   * Convert User to UserResponse (remove sensitive data)
   */
  private toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      created_at: user.created_at,
    };
  }
}
