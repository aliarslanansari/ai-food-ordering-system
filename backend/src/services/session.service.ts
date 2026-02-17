import { randomUUID } from "crypto";
import {
  SessionModel,
  MessageModel,
  SessionContextModel,
  ISession,
  IMessage,
  ISessionContext,
} from "../models/index.js";

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
  // ============================================================
  // Session Management
  // ============================================================

  /**
   * Create a new session
   */
  async createSession(
    userId?: string,
    metadata?: Record<string, any>,
  ): Promise<Session> {
    const now = Date.now();

    const sessionDoc = await SessionModel.create({
      id: randomUUID(),
      user_id: userId || undefined,
      created_at: now,
      last_message_at: now,
      metadata: metadata || {},
    });

    // Initialize session context
    await this.initializeContext(sessionDoc.id);

    console.log(
      `✅ Session created: ${sessionDoc.id}${userId ? ` (user: ${userId})` : ""}`,
    );

    return this.toSession(sessionDoc);
  }

  /**
   * Link session to user
   */
  async linkSessionToUser(sessionId: string, userId: string): Promise<boolean> {
    const result = await SessionModel.updateOne(
      { id: sessionId },
      { $set: { user_id: userId } },
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Session ${sessionId} linked to user ${userId}`);
      return true;
    }

    return false;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const sessionDoc = await SessionModel.findOne({ id: sessionId });
    return sessionDoc ? this.toSession(sessionDoc) : null;
  }

  /**
   * Update session last message time
   */
  async touchSession(sessionId: string): Promise<void> {
    await SessionModel.updateOne(
      { id: sessionId },
      { $set: { last_message_at: Date.now() } },
    );
  }

  /**
   * Update session metadata
   */
  async updateSessionMetadata(
    sessionId: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    await SessionModel.updateOne({ id: sessionId }, { $set: { metadata } });
  }

  /**
   * Delete session (cascades to messages and context via manual cleanup)
   */
  async deleteSession(sessionId: string): Promise<void> {
    // Delete related data
    await MessageModel.deleteMany({ session_id: sessionId });
    await SessionContextModel.deleteOne({ session_id: sessionId });
    await SessionModel.deleteOne({ id: sessionId });

    console.log(`✅ Session deleted: ${sessionId}`);
  }

  /**
   * Get all sessions (with pagination)
   */
  async getAllSessions(
    limit: number = 50,
    offset: number = 0,
  ): Promise<Session[]> {
    const sessionDocs = await SessionModel.find()
      .sort({ last_message_at: -1 })
      .skip(offset)
      .limit(limit);

    return sessionDocs.map((doc) => this.toSession(doc));
  }

  // ============================================================
  // Message Management
  // ============================================================

  /**
   * Add a message to the conversation
   */
  async addMessage(input: CreateMessageInput): Promise<Message> {
    const messageDoc = await MessageModel.create({
      id: randomUUID(),
      session_id: input.session_id,
      role: input.role,
      content: input.content,
      intent: input.intent || undefined,
      filters: input.filters || undefined,
      results: input.results || undefined,
      timestamp: Date.now(),
    });

    // Update session last message time
    await this.touchSession(input.session_id);

    return this.toMessage(messageDoc);
  }

  /**
   * Get conversation history for a session
   */
  async getHistory(sessionId: string, limit?: number): Promise<Message[]> {
    let query = MessageModel.find({ session_id: sessionId }).sort({
      timestamp: 1,
    });

    if (limit) {
      query = query.limit(limit);
    }

    const messageDocs = await query;
    return messageDocs.map((doc) => this.toMessage(doc));
  }

  /**
   * Get recent messages (last N messages)
   */
  async getRecentMessages(
    sessionId: string,
    limit: number = 10,
  ): Promise<Message[]> {
    const messageDocs = await MessageModel.find({ session_id: sessionId })
      .sort({ timestamp: -1 })
      .limit(limit);

    // Reverse to get chronological order
    return messageDocs.reverse().map((doc) => this.toMessage(doc));
  }

  /**
   * Get last user message
   */
  async getLastUserMessage(sessionId: string): Promise<Message | null> {
    const messageDoc = await MessageModel.findOne({
      session_id: sessionId,
      role: "user",
    }).sort({ timestamp: -1 });

    return messageDoc ? this.toMessage(messageDoc) : null;
  }

  /**
   * Get last assistant message
   */
  async getLastAssistantMessage(sessionId: string): Promise<Message | null> {
    const messageDoc = await MessageModel.findOne({
      session_id: sessionId,
      role: "assistant",
    }).sort({ timestamp: -1 });

    return messageDoc ? this.toMessage(messageDoc) : null;
  }

  // ============================================================
  // Session Context Management
  // ============================================================

  /**
   * Initialize context for a new session
   */
  private async initializeContext(sessionId: string): Promise<void> {
    await SessionContextModel.create({
      session_id: sessionId,
      last_mentioned_items: [],
      last_search_query: undefined,
      preferences: {},
      cart_id: undefined,
      updated_at: Date.now(),
    });
  }

  /**
   * Get session context
   */
  async getContext(sessionId: string): Promise<SessionContext | null> {
    const contextDoc = await SessionContextModel.findOne({
      session_id: sessionId,
    });

    if (!contextDoc) {
      return null;
    }

    return this.toSessionContext(contextDoc);
  }

  /**
   * Update session context
   */
  async updateContext(
    sessionId: string,
    updates: Partial<Omit<SessionContext, "session_id" | "updated_at">>,
  ): Promise<void> {
    const current = await this.getContext(sessionId);

    if (!current) {
      console.warn(`⚠️  Context not found for session: ${sessionId}`);
      return;
    }

    const updated: SessionContext = {
      ...current,
      ...updates,
      updated_at: Date.now(),
    };

    await SessionContextModel.updateOne(
      { session_id: sessionId },
      {
        $set: {
          last_mentioned_items: updated.last_mentioned_items,
          last_search_query: updated.last_search_query,
          preferences: updated.preferences,
          cart_id: updated.cart_id,
          updated_at: updated.updated_at,
        },
      },
    );
  }

  /**
   * Update last mentioned items
   */
  async updateLastMentionedItems(
    sessionId: string,
    itemIds: string[],
  ): Promise<void> {
    await this.updateContext(sessionId, { last_mentioned_items: itemIds });
  }

  /**
   * Update last search query
   */
  async updateLastSearchQuery(sessionId: string, query: string): Promise<void> {
    await this.updateContext(sessionId, { last_search_query: query });
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    sessionId: string,
    preferences: Record<string, any>,
  ): Promise<void> {
    const current = await this.getContext(sessionId);
    const merged = {
      ...(current?.preferences || {}),
      ...preferences,
    };
    await this.updateContext(sessionId, { preferences: merged });
  }

  /**
   * Link cart to session
   */
  async linkCart(sessionId: string, cartId: string): Promise<void> {
    await this.updateContext(sessionId, { cart_id: cartId });
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  /**
   * Get conversation summary
   */
  async getConversationSummary(sessionId: string): Promise<{
    messageCount: number;
    userMessages: number;
    assistantMessages: number;
    lastActivity: number;
  }> {
    const result = await MessageModel.aggregate([
      { $match: { session_id: sessionId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          user_count: {
            $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] },
          },
          assistant_count: {
            $sum: { $cond: [{ $eq: ["$role", "assistant"] }, 1, 0] },
          },
          last_activity: { $max: "$timestamp" },
        },
      },
    ]);

    const stats = result[0] || {
      total: 0,
      user_count: 0,
      assistant_count: 0,
      last_activity: 0,
    };

    return {
      messageCount: stats.total || 0,
      userMessages: stats.user_count || 0,
      assistantMessages: stats.assistant_count || 0,
      lastActivity: stats.last_activity || 0,
    };
  }

  /**
   * Clear conversation history (keeps session)
   */
  async clearHistory(sessionId: string): Promise<void> {
    const result = await MessageModel.deleteMany({ session_id: sessionId });
    console.log(
      `✅ History cleared for session: ${sessionId} (${result.deletedCount} messages)`,
    );
  }

  // ============================================================
  // Helpers
  // ============================================================

  private toSession(doc: ISession): Session {
    return {
      id: doc.id,
      user_id: doc.user_id || undefined,
      created_at: doc.created_at,
      last_message_at: doc.last_message_at,
      metadata: doc.metadata || {},
    };
  }

  private toMessage(doc: IMessage): Message {
    return {
      id: doc.id,
      session_id: doc.session_id,
      role: doc.role,
      content: doc.content,
      intent: doc.intent || undefined,
      filters: doc.filters || undefined,
      results: doc.results || undefined,
      timestamp: doc.timestamp,
    };
  }

  private toSessionContext(doc: ISessionContext): SessionContext {
    return {
      session_id: doc.session_id,
      last_mentioned_items: doc.last_mentioned_items || [],
      last_search_query: doc.last_search_query || undefined,
      preferences: doc.preferences || {},
      cart_id: doc.cart_id || undefined,
      updated_at: doc.updated_at,
    };
  }
}
