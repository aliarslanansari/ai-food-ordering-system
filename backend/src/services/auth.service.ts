import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { JWT_SECRET } from "../config/env.js";
import { UserModel, IUser } from "../models/index.js";
import { CartService, type CartWithItems } from "./cart.service.js";

// ============================================================
// Types
// ============================================================

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

export class AuthService {
  private cartService: CartService;

  constructor() {
    this.cartService = new CartService();
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await UserModel.findOne({ email: input.email });

    if (existingUser) {
      throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const userId = randomUUID();
    const now = Date.now();

    const user = await UserModel.create({
      id: userId,
      email: input.email,
      password_hash: passwordHash,
      name: input.name,
      phone: input.phone || null,
      created_at: now,
    });

    const token = this.generateToken(user);

    let cart: CartWithItems | undefined;
    if (input.session_id) {
      cart =
        (await this.cartService.mergeCarts(input.session_id, userId)) ||
        undefined;
    }

    return {
      user: this.toUserResponse(user),
      token,
      cart,
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await UserModel.findOne({ email: input.email });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isValid = await bcrypt.compare(input.password, user.password_hash);

    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    const token = this.generateToken(user);

    let cart: CartWithItems | undefined;
    if (input.session_id) {
      cart =
        (await this.cartService.mergeCarts(input.session_id, user.id)) ||
        undefined;
    }

    return {
      user: this.toUserResponse(user),
      token,
      cart,
    };
  }

  async getUserById(userId: string): Promise<UserResponse | null> {
    const user = await UserModel.findOne({ id: userId });
    return user ? this.toUserResponse(user) : null;
  }

  verifyToken(token: string): string {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      return decoded.userId;
    } catch {
      throw new Error("Invalid token");
    }
  }

  private generateToken(user: IUser): string {
    return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  }

  private toUserResponse(user: IUser): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      created_at: user.created_at,
    };
  }
}
