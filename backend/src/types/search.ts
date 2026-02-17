export enum SearchMode {
  Hybrid = "hybrid",
  SemanticOnly = "semantic_only",
  Keyword = "keyword",
  NoResults = "no_results",
}

export interface CartSummary {
  has_cart: boolean;
  item_count: number;
  total: number;
  items?: {
    id: string;
    food_id: string;
    food_name: string;
    quantity: number;
    price: number;
    added_at: number;
  }[];
}

export interface SearchResponse {
  session_id: string;
  is_new_session: boolean;
  intent: string;
  filters?: Record<string, any>;
  filter_description?: string;
  semantic_query?: string;
  results?: any[];
  total?: number;
  search_mode?: SearchMode;
  conversation?: {
    message_count: number;
    turn_number: number;
  };
  cart_summary?: CartSummary; // NEW - Cart info in every response
  fallback_info?: {
    original_filters: Record<string, any>;
    reason: string;
  };
  message?: string;
  follow_up_question?: string; // Follow-up question to suggest add-ons/sides
  suggestions?: string[];
  error?: string;
  // For add_to_cart intent
  items_added?: any[];
  cart?: any;
  resolution?: {
    reference: string;
    resolved_to: string | string[];
    confidence: number;
    reason?: string;
  };
  // For details intent
  item?: any;
  // For checkout intent
  next_step?: string;
  show_checkout_button?: boolean; // Show checkout button in chat
  // For disambiguation intent
  requires_disambiguation?: boolean;
  // For compound requests
  secondary_results?: any[];
  // For result availability info
  result_info?: {
    requested: number | null;
    available: number;
    message: string;
  };
  // For related recommendations when exact matches not found
  related_recommendations?: {
    reason: string;
    message: string;
    items: any[];
  };
}
