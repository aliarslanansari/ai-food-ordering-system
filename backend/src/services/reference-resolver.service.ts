import { SessionService } from "./session.service.js";
import { getFoods } from "./data.service.js";
import { Food } from "../types/food.js";
import { resolveReferenceWithAI } from "./gemini.service.js";

/**
 * Reference Resolution Service
 * Resolves references like "that", "it", "the first one" to actual food items
 */
export class ReferenceResolver {
  constructor(private sessionService: SessionService) {}

  /**
   * Get ALL mentioned items from the entire conversation history
   * Collects unique items mentioned across all assistant messages
   */
  private async getAllMentionedItems(sessionId: string): Promise<string[]> {
    const allItemIds: string[] = [];
    const seenIds = new Set<string>();

    // Get all messages from the session
    const allMessages = await this.sessionService.getRecentMessages(
      sessionId,
      50, // Get more messages to collect all mentions
    );
    console.log(
      `[Resolver] Checking ${allMessages.length} messages for all mentions`,
    );

    // Scan all assistant messages for mentioned items
    for (const msg of allMessages) {
      if (msg.role === "assistant" && msg.results && msg.results.length > 0) {
        // Extract food IDs from message results
        const itemIds = msg.results
          .filter((r: any) => r.id)
          .map((r: any) => r.id);

        // Add unique items to the list
        for (const id of itemIds) {
          if (!seenIds.has(id)) {
            seenIds.add(id);
            allItemIds.push(id);
          }
        }
      }
    }

    console.log(
      `[Resolver] ✅ Found ${allItemIds.length} unique items in conversation history`,
    );
    return allItemIds;
  }

  /**
   * Resolve item reference from user message
   * @param itemReference - The reference string (e.g., "that", "the first one", "both")
   * @param sessionId - Session ID to get context
   * @returns Array of resolved food items
   */
  async resolveReference(
    itemReference: string,
    sessionId: string,
  ): Promise<{ items: Food[]; confidence: number; reason: string }> {
    if (!itemReference) {
      return { items: [], confidence: 0, reason: "No reference provided" };
    }

    // Get all mentioned items from conversation history
    const allItems = await this.getAllMentionedItems(sessionId);
    console.log({ allItems, itemReference, sessionId });

    if (allItems.length === 0) {
      return {
        items: [],
        confidence: 0,
        reason: "No items in conversation context",
      };
    }

    const allFoods = getFoods();

    // Get full food objects for candidates
    const candidateFoods = allItems
      .map((id) => allFoods.find((f) => f.id === id))
      .filter((f): f is Food => f !== undefined);

    // Use AI for semantic reference resolution
    const aiResult = await resolveReferenceWithAI(
      itemReference,
      candidateFoods,
    );

    if (aiResult.indices.length > 0) {
      const resolvedItems = aiResult.indices.map((i) => candidateFoods[i]);
      return {
        items: resolvedItems,
        confidence: aiResult.confidence,
        reason: `AI: ${aiResult.reasoning}`,
      };
    }

    // Fallback: No match found
    return {
      items: [],
      confidence: 0,
      reason: `Could not resolve reference: '${itemReference}'`,
    };
  }

  /**
   * Check if a message contains a reference
   */
  containsReference(message: string): boolean {
    const msg = message.toLowerCase();
    const referencePatterns = [
      /\b(?:that|it|this|these|those)\b/,
      /\b(?:the\s+)?(?:first|second|third|last)(?:\s+one)?\b/,
      /\b(?:both|all|everything)\b/,
      /\b(?:1st|2nd|3rd|\d+(?:st|nd|rd|th)?)\b/,
    ];

    return referencePatterns.some((pattern) => pattern.test(msg));
  }

  /**
   * Get explanation for why reference resolution worked or failed
   */
  async getResolutionExplanation(
    itemReference: string,
    sessionId: string,
  ): Promise<string> {
    const result = await this.resolveReference(itemReference, sessionId);

    if (result.items.length > 0) {
      return `✅ ${result.reason}`;
    } else {
      return `❌ ${result.reason}. Please specify which item you're referring to.`;
    }
  }
}
