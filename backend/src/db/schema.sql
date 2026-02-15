-- ============================================================
-- User Authentication Schema
-- ============================================================

-- Users table: Registered users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  created_at INTEGER NOT NULL
);

-- ============================================================
-- Session & Conversation Memory Schema
-- ============================================================

-- Sessions table: Tracks user conversation sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT, -- NULL for guest sessions
  created_at INTEGER NOT NULL,
  last_message_at INTEGER NOT NULL,
  metadata TEXT DEFAULT '{}', -- JSON: user preferences, settings, etc.
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index for user sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Messages table: Stores conversation history
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  intent TEXT, -- extracted intent (for user messages)
  filters TEXT, -- JSON: applied filters
  results TEXT, -- JSON: returned items
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Session context: Quick access to conversation state
CREATE TABLE IF NOT EXISTS session_context (
  session_id TEXT PRIMARY KEY,
  last_mentioned_items TEXT DEFAULT '[]', -- JSON: array of food IDs from last search
  last_search_query TEXT, -- last semantic query
  preferences TEXT DEFAULT '{}', -- JSON: learned user preferences
  cart_id TEXT, -- reference to cart (for future use)
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Carts table: Shopping carts (linked to sessions and optionally users)
CREATE TABLE IF NOT EXISTS carts (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT, -- NULL for guest carts
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index for user carts
CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id);

-- Cart items table: Items in shopping carts
CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL,
  food_id TEXT NOT NULL,
  food_name TEXT NOT NULL, -- denormalized for easier access
  quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
  price REAL NOT NULL,
  added_at INTEGER NOT NULL,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE
);

-- Orders table: Completed orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, -- Required: orders must be linked to users
  session_id TEXT, -- Optional: may be null if ordered without chat
  cart_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  delivery_instructions TEXT,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  payment_method TEXT NOT NULL DEFAULT 'cod',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Create index for user orders
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC);

-- Order items table: Items in completed orders
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  food_id TEXT NOT NULL,
  food_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_message ON sessions(last_message_at);
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);

-- ============================================================
-- Sample queries for testing
-- ============================================================

-- Get recent sessions
-- SELECT * FROM sessions ORDER BY last_message_at DESC LIMIT 10;

-- Get conversation history for a session
-- SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC;

-- Get session context
-- SELECT * FROM session_context WHERE session_id = ?;

-- Clean up old sessions (older than 7 days)
-- DELETE FROM sessions WHERE last_message_at < (strftime('%s', 'now') - 604800) * 1000;