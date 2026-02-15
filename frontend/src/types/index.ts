// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

// Food Types
export interface Food {
  id: string;
  name: string;
  description: string;
  category: string;
  type: "Vegetarian" | "Non-Vegetarian";
  spiceLevel: string;
  ingredients: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  price: number;
  serves: number;
  imageUrl: string;
  isVegetarian: boolean;
}

// Cart Types
export interface CartItem {
  id: string;
  foodId: string;
  foodName: string;
  quantity: number;
  price: number;
  addedAt: number;
}

export interface Cart {
  id: string;
  sessionId: string;
  userId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CartWithItems {
  cart: Cart | null;
  items: CartItem[];
  total: number;
  itemCount: number;
}

// Chat Types
export type MessageRole = "user" | "assistant";

export type Intent =
  | "recommend"
  | "add_to_cart"
  | "details"
  | "checkout"
  | "unknown";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  intent?: Intent;
  foods?: Food[];
  cartSummary?: CartWithItems;
  timestamp: number;
}

export interface SearchFilters {
  category?: string;
  proteinLevel?: "high" | "medium" | "low";
  carbLevel?: "high" | "medium" | "low";
  vegetarian?: boolean;
  spiceLevel?: "mild" | "medium" | "spicy";
  budget?: number;
}

export interface SearchResponse {
  sessionId: string;
  isNewSession: boolean;
  intent: Intent;
  filters?: SearchFilters;
  filterDescription?: string;
  semanticQuery?: string;
  results: Food[];
  total: number;
  searchMode: "hybrid" | "semantic" | "keyword" | "no_results";
  message: string;
  suggestions?: string[];
  cartSummary?: CartWithItems;
  itemsAdded?: CartItem[];
  error?: string;
}

export interface SendMessageInput {
  message: string;
  sessionId?: string;
}

// Order Types
export interface Order {
  id: string;
  userId: string;
  sessionId?: string;
  items: CartItem[];
  total: number;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  customerName: string;
  phone: string;
  address: string;
  deliveryInstructions?: string;
  createdAt: number;
  itemCount?: number; // For list views
}

export interface CreateOrderInput {
  session_id?: string;
  customer_name: string;
  phone: string;
  address: string;
  delivery_instructions?: string;
}
