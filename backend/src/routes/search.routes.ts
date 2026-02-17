import { Router } from "express";
import { extractIntent } from "../services/intent.service.js";
import { generateQueryEmbedding } from "../services/gemini.service.js";
import {
  hybridSearch,
  semanticOnlySearch,
  keywordSearch,
} from "../services/retrieval.service.js";
import {
  normalizeFilters,
  describeFilters,
} from "../services/filter-normalizer.js";
import { SearchMode, SearchResponse } from "../types/search.js";
import { SessionService } from "../services/session.service.js";
import { CartService } from "../services/cart.service.js";
import { ReferenceResolver } from "../services/reference-resolver.service.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Initialize services
const sessionService = new SessionService();
const cartService = new CartService();
const referenceResolver = new ReferenceResolver(sessionService);

router.post("/", optionalAuth, async (req, res) => {
  try {
    const { message, session_id } = req.body;
    const userId = req.user?.id;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Valid message required" });
    }

    // Step 1: Get or create session
    let sessionId = session_id;
    let isNewSession = false;

    if (!sessionId) {
      const session = await sessionService.createSession(userId);
      sessionId = session.id;
      isNewSession = true;
    } else {
      const session = await sessionService.getSession(sessionId);
      if (!session) {
        const newSession = await sessionService.createSession(userId);
        sessionId = newSession.id;
        isNewSession = true;
      } else if (userId && !session.user_id) {
        // Link existing session to user if they're now logged in
        await sessionService.linkSessionToUser(sessionId, userId);
      }
    }

    // Step 2: Add user message to history
    await sessionService.addMessage({
      session_id: sessionId,
      role: "user",
      content: message,
    });

    // Step 3: Get conversation history for context
    const conversationHistory = await sessionService.getRecentMessages(
      sessionId,
      5,
    );

    // Step 4: Extract intent (with conversation context)
    const intentData = await extractIntent(message, conversationHistory);

    console.log("Intent extracted:", {
      intent: intentData.intent,
      has_reference: !!intentData.item_reference,
      reference: intentData.item_reference,
    });

    // ============================================================
    // Handle ADD_TO_CART Intent
    // ============================================================
    if (intentData.intent === "add_to_cart") {
      // Try to resolve reference
      if (intentData.item_reference) {
        const resolved = await referenceResolver.resolveReference(
          intentData.item_reference,
          sessionId,
        );

        if (resolved.items.length > 0) {
          // Get or create cart with user context
          const cart = await cartService.getOrCreateCart(sessionId, userId);

          // Add resolved items to cart
          const addedItems = [];
          for (const food of resolved.items) {
            const item = await cartService.addItem({
              cart_id: cart.id,
              session_id: sessionId,
              user_id: userId,
              food_id: food.id,
              food_name: food.name,
              quantity: 1,
              price: food.price,
            });
            addedItems.push(item);
          }

          // Get updated cart
          const cartWithItems = await cartService.getCartWithItems(
            sessionId,
            userId,
          );

          const response = {
            session_id: sessionId,
            is_new_session: isNewSession,
            intent: "add_to_cart",
            message: `Added ${addedItems.length} item(s) to cart: ${addedItems.map((i) => i.food_name).join(", ")}`,
            items_added: addedItems,
            cart: cartWithItems,
            resolution: {
              reference: intentData.item_reference,
              resolved_to: resolved.items.map((f) => f.name),
              confidence: resolved.confidence,
              reason: resolved.reason,
            },
          };

          // Save assistant response
          await sessionService.addMessage({
            session_id: sessionId,
            role: "assistant",
            content: JSON.stringify(response),
            intent: "add_to_cart",
          });

          return res.json(response);
        } else {
          // Could not resolve reference
          const response = {
            session_id: sessionId,
            is_new_session: isNewSession,
            intent: "add_to_cart",
            error: "Could not determine which item to add",
            message: resolved.reason,
            suggestion:
              "Please specify which item you'd like to add, or search for it again.",
          };

          await sessionService.addMessage({
            session_id: sessionId,
            role: "assistant",
            content: JSON.stringify(response),
            intent: "add_to_cart",
          });

          return res.json(response);
        }
      } else {
        // No reference provided - ask user to clarify
        const response = {
          session_id: sessionId,
          is_new_session: isNewSession,
          intent: "add_to_cart",
          message: "Which item would you like to add to your cart?",
          suggestion: "Please search for an item first, then add it to cart.",
        };

        await sessionService.addMessage({
          session_id: sessionId,
          role: "assistant",
          content: JSON.stringify(response),
          intent: "add_to_cart",
        });

        return res.json(response);
      }
    }

    // ============================================================
    // Handle DETAILS Intent
    // ============================================================
    if (intentData.intent === "details") {
      if (intentData.item_reference) {
        const resolved = await referenceResolver.resolveReference(
          intentData.item_reference,
          sessionId,
        );

        if (resolved.items.length > 0) {
          const food = resolved.items[0]; // Get first item for details

          const response = {
            session_id: sessionId,
            is_new_session: isNewSession,
            intent: "details",
            item: food,
            resolution: {
              reference: intentData.item_reference,
              resolved_to: food.name,
              confidence: resolved.confidence,
            },
          };

          await sessionService.addMessage({
            session_id: sessionId,
            role: "assistant",
            content: JSON.stringify(response),
            intent: "details",
          });

          return res.json(response);
        }
      }

      // Could not resolve - return error
      return res.json({
        session_id: sessionId,
        is_new_session: isNewSession,
        intent: "details",
        error: "Could not determine which item you're asking about",
        message: "Please specify which item you'd like more details on.",
      });
    }

    // ============================================================
    // Handle CHECKOUT Intent
    // ============================================================
    if (intentData.intent === "checkout") {
      const cartWithItems = await cartService.getCartWithItems(sessionId);

      if (!cartWithItems || cartWithItems.items.length === 0) {
        return res.json({
          session_id: sessionId,
          is_new_session: isNewSession,
          intent: "checkout",
          error: "Cart is empty",
          message: "Your cart is empty. Please add some items first.",
        });
      }

      const response = {
        session_id: sessionId,
        is_new_session: isNewSession,
        intent: "checkout",
        message: "Ready to checkout!",
        cart: cartWithItems,
        next_step: "Please provide delivery details",
      };

      await sessionService.addMessage({
        session_id: sessionId,
        role: "assistant",
        content: JSON.stringify(response),
        intent: "checkout",
      });

      return res.json(response);
    }

    // ============================================================
    // Handle RECOMMEND Intent (existing search logic)
    // ============================================================

    // Normalize filters
    const normalizedFilters = normalizeFilters(intentData.filters);
    const filterDescription = describeFilters(normalizedFilters);

    // Generate embedding for semantic search
    const queryText = intentData.semantic_query || message;
    const queryEmbedding = await generateQueryEmbedding(queryText);

    if (!queryEmbedding || queryEmbedding.length === 0) {
      return res
        .status(500)
        .json({ error: "Failed to generate query embedding" });
    }

    // Try hybrid search with filters
    let results = hybridSearch(queryEmbedding, normalizedFilters);
    let searchMode: SearchMode = SearchMode.Hybrid;
    let fallbackUsed = false;

    // Fallback Strategy 1: If no results, try semantic-only
    if (results.length === 0 && Object.keys(normalizedFilters).length > 0) {
      results = semanticOnlySearch(queryEmbedding, 10);
      searchMode = SearchMode.SemanticOnly;
      fallbackUsed = true;
    }

    // Fallback Strategy 2: If still no results, try keyword search
    if (results.length === 0) {
      results = keywordSearch(queryText, 10);
      searchMode = SearchMode.Keyword;
      fallbackUsed = true;
    }

    // Update session context with results
    if (results.length > 0) {
      const itemIds = results.slice(0, 10).map((r) => r.id);
      await sessionService.updateLastMentionedItems(sessionId, itemIds);
      await sessionService.updateLastSearchQuery(sessionId, queryText);
    }

    // Prepare response
    const topResults = results.slice(0, 5);

    // Get cart with user context and summary
    const cart = await cartService.getOrCreateCart(sessionId, userId);
    const cartWithItems = await cartService.getCartWithItems(sessionId, userId);
    const cartSummary = cartWithItems
      ? {
          has_cart: true,
          item_count: cartWithItems.item_count,
          total: cartWithItems.total,
        }
      : {
          has_cart: false,
          item_count: 0,
          total: 0,
        };

    // If no results
    if (results.length === 0) {
      const response: SearchResponse = {
        session_id: sessionId,
        is_new_session: isNewSession,
        intent: intentData.intent,
        filters: normalizedFilters,
        filter_description: filterDescription,
        semantic_query: queryText,
        results: [],
        total: 0,
        search_mode: SearchMode.NoResults,
        message:
          "We couldn't find any dishes matching your request. Try a different query or browse our menu.",
        suggestions: [
          "Try searching for a different cuisine or dish type",
          "Remove some filters to see more options",
          "Browse our popular items",
        ],
        cart_summary: cartSummary,
      };

      await sessionService.addMessage({
        session_id: sessionId,
        role: "assistant",
        content: JSON.stringify(response),
        intent: intentData.intent,
        filters: normalizedFilters,
        results: [],
      });

      return res.json(response);
    }

    // Success response
    const summary = await sessionService.getConversationSummary(sessionId);
    const response: SearchResponse = {
      session_id: sessionId,
      is_new_session: isNewSession,
      intent: intentData.intent,
      message:
        intentData.message ||
        `Found ${results.length} delicious options for you!`,
      follow_up_question:
        intentData.follow_up_question ||
        "Would you like to add any sides or drinks?",
      filters: normalizedFilters,
      filter_description: filterDescription,
      semantic_query: queryText,
      results: topResults,
      total: results.length,
      search_mode: searchMode,
      conversation: {
        message_count: summary.messageCount,
        turn_number: Math.floor(summary.userMessages),
      },
      cart_summary: cartSummary,
    };

    // Add fallback info if used
    if (fallbackUsed) {
      response.fallback_info = {
        original_filters: normalizedFilters,
        reason:
          searchMode === SearchMode.SemanticOnly
            ? "Structured filters were too restrictive. Showing semantically similar items."
            : "No exact matches found. Showing keyword matches.",
      };
    }

    // Save assistant response
    await sessionService.addMessage({
      session_id: sessionId,
      role: "assistant",
      content: JSON.stringify(topResults),
      intent: intentData.intent,
      filters: normalizedFilters,
      results: topResults,
    });

    res.json(response);
  } catch (error) {
    console.error("Search error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Search failed";
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Get session history
 */
router.get("/:sessionId/history", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;

    const session = await sessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const history = await sessionService.getHistory(sessionId, limit);
    const context = await sessionService.getContext(sessionId);
    const summary = await sessionService.getConversationSummary(sessionId);

    res.json({
      session,
      history,
      context,
      summary,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

/**
 * Get session context
 */
router.get("/:sessionId/context", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const context = await sessionService.getContext(sessionId);
    if (!context) {
      return res.status(404).json({ error: "Context not found" });
    }

    res.json(context);
  } catch (error) {
    console.error("Error fetching context:", error);
    res.status(500).json({ error: "Failed to fetch context" });
  }
});

export default router;
