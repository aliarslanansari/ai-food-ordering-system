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
  cart?: CartWithItems;
}

export interface LoginInput {
  email: string;
  password: string;
  session_id?: string;
}

export interface SignupInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  session_id?: string;
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
  image_url: string;
  isVegetarian: boolean;
}

// Cart Types
export interface CartItem {
  id: string;
  food_id: string;
  food_name: string;
  quantity: number;
  price: number;
  added_at: number;
}

export interface Cart {
  id: string;
  session_id: string;
  user_id?: string;
  created_at: number;
  updated_at: number;
}

export interface CartWithItems {
  cart: Cart | null;
  items: CartItem[];
  total: number;
  item_count: number;
}

// Related Recommendations
export interface RelatedRecommendations {
  reason: string;
  message: string;
  items: Food[];
}

// Chat Types
export type MessageRole = "user" | "assistant";

export type Intent =
  | "recommend"
  | "add_to_cart"
  | "details"
  | "checkout"
  | "disambiguate"
  | "unknown";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  intent?: Intent;
  foods?: Food[];
  secondaryFoods?: Food[]; // For compound requests
  relatedFoods?: RelatedRecommendations; // For related recommendations when no exact matches
  cartSummary?: CartSummary;
  followUpQuestion?: string;
  showCheckoutButton?: boolean;
  requiresDisambiguation?: boolean;
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

export interface CartSummary {
  has_cart: boolean;
  item_count: number;
  total: number;
  items?: CartItem[];
}

export interface SearchResponse {
  session_id: string;
  is_new_session: boolean;
  intent: Intent;
  filters?: SearchFilters;
  filter_description?: string;
  semantic_query?: string;
  results: Food[];
  secondary_results?: Food[]; // For compound requests
  related_recommendations?: RelatedRecommendations; // For related recommendations when no exact matches
  total: number;
  search_mode: "hybrid" | "semantic" | "keyword" | "no_results";
  message: string;
  follow_up_question?: string;
  suggestions?: string[];
  cart_summary?: CartSummary;
  cart?: CartWithItems;
  items_added?: CartItem[];
  error?: string;
  show_checkout_button?: boolean;
  requires_disambiguation?: boolean;
}

export interface SendMessageInput {
  message: string;
  session_id?: string;
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
