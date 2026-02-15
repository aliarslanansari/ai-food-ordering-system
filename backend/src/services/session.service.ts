import Database from "better-sqlite3";
import { randomUUID } from "crypto";

// ============================================================
// Type Definitions
// ============================================================

export interface Session {
  id: string;
  user_id?: string;
  created_at: number;
  last_message_at: number;
  metadata?: Record<string, any>;
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  filters?: Record<string, any>;
  results?: any[];
  timestamp: number;
}

export interface SessionContext {
  session_id: string;
  last_mentioned_items: string[];
  last_search_query?: string;
  preferences: Record<string, any>;
  cart_id?: string;
  updated_at: number;
}

export interface CreateMessageInput {
  session_id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  filters?: Record<string, any>;
  results?: any[];
}

// ============================================================
// Session Service
// ============================================================

export class SessionService {
  constructor(private db: Database.Database) {}

  // ============================================================
  // Session Management
  // ============================================================

  /**
   * Create a new session
   */
  createSession(userId?: string, metadata?: Record<string, any>): Session {
    const session: Session = {
      id: randomUUID(),
      user_id: userId,
      created_at: Date.now(),
      last_message_at: Date.now(),
      metadata: metadata || {},
    };

    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, user_id, created_at, last_message_at, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      session.id,
      session.user_id || null,
      session.created_at,
      session.last_message_at,
      JSON.stringify(session.metadata),
    );

    // Initialize session context
    this.initializeContext(session.id);

    console.log(
      `✅ Session created: ${session.id}${userId ? ` (user: ${userId})` : ""}`,
    );
    return session;
  }

  /**
   * Link session to user
   */
  linkSessionToUser(sessionId: string, userId: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE sessions SET user_id = ? WHERE id = ?
    `);

    const result = stmt.run(userId, sessionId);

    if (result.changes > 0) {
      console.log(`✅ Session ${sessionId} linked to user ${userId}`);
      return true;
    }

    return false;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | null {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions WHERE id = ?
    `);

    const row = stmt.get(sessionId) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      user_id: row.user_id,
      created_at: row.created_at,
      last_message_at: row.last_message_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
    };
  }

  /**
   * Update session last message time
   */
  touchSession(sessionId: string): void {
    const stmt = this.db.prepare(`
      UPDATE sessions SET last_message_at = ? WHERE id = ?
    `);

    stmt.run(Date.now(), sessionId);
  }

  /**
   * Update session metadata
   */
  updateSessionMetadata(
    sessionId: string,
    metadata: Record<string, any>,
  ): void {
    const stmt = this.db.prepare(`
      UPDATE sessions SET metadata = ? WHERE id = ?
    `);

    stmt.run(JSON.stringify(metadata), sessionId);
  }

  /**
   * Delete session (cascades to messages and context)
   */
  deleteSession(sessionId: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM sessions WHERE id = ?
    `);

    stmt.run(sessionId);
    console.log(`✅ Session deleted: ${sessionId}`);
  }

  /**
   * Get all sessions (with pagination)
   */
  getAllSessions(limit: number = 50, offset: number = 0): Session[] {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions 
      ORDER BY last_message_at DESC 
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(limit, offset) as any[];

    return rows.map((row) => ({
      id: row.id,
      created_at: row.created_at,
      last_message_at: row.last_message_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
    }));
  }

  // ============================================================
  // Message Management
  // ============================================================

  /**
   * Add a message to the conversation
   */
  addMessage(input: CreateMessageInput): Message {
    const message: Message = {
      id: randomUUID(),
      session_id: input.session_id,
      role: input.role,
      content: input.content,
      intent: input.intent,
      filters: input.filters,
      results: input.results,
      timestamp: Date.now(),
    };

    const stmt = this.db.prepare(`
      INSERT INTO messages (
        id, session_id, role, content, intent, filters, results, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      message.id,
      message.session_id,
      message.role,
      message.content,
      message.intent || null,
      message.filters ? JSON.stringify(message.filters) : null,
      message.results ? JSON.stringify(message.results) : null,
      message.timestamp,
    );

    // Update session last message time
    this.touchSession(input.session_id);

    return message;
  }

  /**
   * Get conversation history for a session
   */
  getHistory(sessionId: string, limit?: number): Message[] {
    let query = `
      SELECT * FROM messages 
      WHERE session_id = ? 
      ORDER BY timestamp ASC
    `;

    if (limit) {
      query += ` LIMIT ?`;
    }

    const stmt = this.db.prepare(query);
    const rows = limit
      ? (stmt.all(sessionId, limit) as any[])
      : (stmt.all(sessionId) as any[]);

    return rows.map((row) => ({
      id: row.id,
      session_id: row.session_id,
      role: row.role,
      content: row.content,
      intent: row.intent || undefined,
      filters: row.filters ? JSON.parse(row.filters) : undefined,
      results: row.results ? JSON.parse(row.results) : undefined,
      timestamp: row.timestamp,
    }));
  }

  /**
   * Get recent messages (last N messages)
   */
  getRecentMessages(sessionId: string, limit: number = 10): Message[] {
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE session_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);

    const rows = stmt.all(sessionId, limit) as any[];

    // Reverse to get chronological order
    return rows.reverse().map((row) => ({
      id: row.id,
      session_id: row.session_id,
      role: row.role,
      content: row.content,
      intent: row.intent || undefined,
      filters: row.filters ? JSON.parse(row.filters) : undefined,
      results: row.results ? JSON.parse(row.results) : undefined,
      timestamp: row.timestamp,
    }));
  }

  /**
   * Get last user message
   */
  getLastUserMessage(sessionId: string): Message | null {
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE session_id = ? AND role = 'user'
      ORDER BY timestamp DESC 
      LIMIT 1
    `);

    const row = stmt.get(sessionId) as any;

    if (!row) return null;

    return {
      id: row.id,
      session_id: row.session_id,
      role: row.role,
      content: row.content,
      intent: row.intent || undefined,
      filters: row.filters ? JSON.parse(row.filters) : undefined,
      results: row.results ? JSON.parse(row.results) : undefined,
      timestamp: row.timestamp,
    };
  }

  /**
   * Get last assistant message
   */
  getLastAssistantMessage(sessionId: string): Message | null {
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE session_id = ? AND role = 'assistant'
      ORDER BY timestamp DESC 
      LIMIT 1
    `);

    const row = stmt.get(sessionId) as any;

    if (!row) return null;

    return {
      id: row.id,
      session_id: row.session_id,
      role: row.role,
      content: row.content,
      intent: row.intent || undefined,
      filters: row.filters ? JSON.parse(row.filters) : undefined,
      results: row.results ? JSON.parse(row.results) : undefined,
      timestamp: row.timestamp,
    };
  }

  // ============================================================
  // Session Context Management
  // ============================================================

  /**
   * Initialize context for a new session
   */
  private initializeContext(sessionId: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO session_context (
        session_id, last_mentioned_items, preferences, updated_at
      ) VALUES (?, ?, ?, ?)
    `);

    stmt.run(sessionId, "[]", "{}", Date.now());
  }

  /**
   * Get session context
   */
  getContext(sessionId: string): SessionContext | null {
    const stmt = this.db.prepare(`
      SELECT * FROM session_context WHERE session_id = ?
    `);

    const row = stmt.get(sessionId) as any;

    if (!row) {
      return null;
    }

    return {
      session_id: row.session_id,
      last_mentioned_items: JSON.parse(row.last_mentioned_items || "[]"),
      last_search_query: row.last_search_query || undefined,
      preferences: JSON.parse(row.preferences || "{}"),
      cart_id: row.cart_id || undefined,
      updated_at: row.updated_at,
    };
  }

  /**
   * Update session context
   */
  updateContext(
    sessionId: string,
    updates: Partial<Omit<SessionContext, "session_id" | "updated_at">>,
  ): void {
    const current = this.getContext(sessionId);

    if (!current) {
      console.warn(`⚠️  Context not found for session: ${sessionId}`);
      return;
    }

    const updated: SessionContext = {
      ...current,
      ...updates,
      updated_at: Date.now(),
    };

    const stmt = this.db.prepare(`
      UPDATE session_context 
      SET last_mentioned_items = ?,
          last_search_query = ?,
          preferences = ?,
          cart_id = ?,
          updated_at = ?
      WHERE session_id = ?
    `);

    stmt.run(
      JSON.stringify(updated.last_mentioned_items),
      updated.last_search_query || null,
      JSON.stringify(updated.preferences),
      updated.cart_id || null,
      updated.updated_at,
      sessionId,
    );
  }

  /**
   * Update last mentioned items
   */
  updateLastMentionedItems(sessionId: string, itemIds: string[]): void {
    this.updateContext(sessionId, { last_mentioned_items: itemIds });
  }

  /**
   * Update last search query
   */
  updateLastSearchQuery(sessionId: string, query: string): void {
    this.updateContext(sessionId, { last_search_query: query });
  }

  /**
   * Update user preferences
   */
  updatePreferences(sessionId: string, preferences: Record<string, any>): void {
    const current = this.getContext(sessionId);
    const merged = {
      ...(current?.preferences || {}),
      ...preferences,
    };
    this.updateContext(sessionId, { preferences: merged });
  }

  /**
   * Link cart to session
   */
  linkCart(sessionId: string, cartId: string): void {
    this.updateContext(sessionId, { cart_id: cartId });
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  /**
   * Get conversation summary
   */
  getConversationSummary(sessionId: string): {
    messageCount: number;
    userMessages: number;
    assistantMessages: number;
    lastActivity: number;
  } {
    const countStmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_count,
        SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) as assistant_count,
        MAX(timestamp) as last_activity
      FROM messages 
      WHERE session_id = ?
    `);

    const result = countStmt.get(sessionId) as any;

    return {
      messageCount: result.total || 0,
      userMessages: result.user_count || 0,
      assistantMessages: result.assistant_count || 0,
      lastActivity: result.last_activity || 0,
    };
  }

  /**
   * Clear conversation history (keeps session)
   */
  clearHistory(sessionId: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM messages WHERE session_id = ?
    `);

    stmt.run(sessionId);
    console.log(`✅ History cleared for session: ${sessionId}`);
  }
}
