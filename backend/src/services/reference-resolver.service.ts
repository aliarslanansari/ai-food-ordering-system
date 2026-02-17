import { SessionService } from "./session.service.js";
import { getFoods } from "./data.service.js";
import { Food } from "../types/food.js";

/**
 * Reference Resolution Service
 * Resolves references like "that", "it", "the first one" to actual food items
 */
export class ReferenceResolver {
  constructor(private sessionService: SessionService) {}

  /**
   * Get last mentioned items from context or conversation history
   */
  private async getLastMentionedItems(sessionId: string): Promise<string[]> {
    // First try to get from context
    const context = await this.sessionService.getContext(sessionId);
    console.log(`[Resolver] Context for ${sessionId}:`, context);

    if (
      context?.last_mentioned_items &&
      context.last_mentioned_items.length > 0
    ) {
      console.log(
        `[Resolver] Found ${context.last_mentioned_items.length} items in context`,
      );
      return context.last_mentioned_items;
    }

    // Fallback: check recent assistant messages for results
    const recentMessages = await this.sessionService.getRecentMessages(
      sessionId,
      10,
    );
    console.log(`[Resolver] Checking ${recentMessages.length} recent messages`);

    for (let i = recentMessages.length - 1; i >= 0; i--) {
      const msg = recentMessages[i];
      console.log(
        `[Resolver] Message ${i}: role=${msg.role}, hasResults=${!!msg.results}, resultsLength=${msg.results?.length || 0}`,
      );

      if (msg.role === "assistant" && msg.results && msg.results.length > 0) {
        console.log(
          `[Resolver] Assistant message results:`,
          JSON.stringify(msg.results).substring(0, 200),
        );

        // Extract food IDs from message results
        const itemIds = msg.results
          .filter((r: any) => r.id)
          .map((r: any) => r.id);

        console.log(`[Resolver] Extracted itemIds:`, itemIds);

        if (itemIds.length > 0) {
          console.log(
            `[Resolver] ✅ Found ${itemIds.length} items in message history`,
          );
          return itemIds;
        }
      }
    }

    console.log(`[Resolver] ❌ No items found in context or history`);
    return [];
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

    // Get last mentioned items from context or history
    const lastItems = await this.getLastMentionedItems(sessionId);
    console.log({ lastItems, itemReference, sessionId });

    if (lastItems.length === 0) {
      return {
        items: [],
        confidence: 0,
        reason: "No items in conversation context",
      };
    }

    const allFoods = getFoods();

    // Normalize reference
    const ref = itemReference.toLowerCase().trim();

    // Pattern 1: Simple references (that, it, this, those)
    if (["that", "it", "this", "these", "those"].includes(ref)) {
      // Return the first item (most recently mentioned)
      const foodId = lastItems[0];
      const food = allFoods.find((f) => f.id === foodId);

      if (food) {
        return {
          items: [food],
          confidence: 0.9,
          reason: `Resolved '${ref}' to the most recent item: ${food.name}`,
        };
      }
    }

    // Pattern 2: Ordinal references (first, second, last)
    const ordinalMatch = ref.match(
      /(?:the\s+)?(first|second|third|last)(?:\s+one)?/,
    );
    if (ordinalMatch) {
      const ordinal = ordinalMatch[1];
      let index: number;

      switch (ordinal) {
        case "first":
          index = 0;
          break;
        case "second":
          index = 1;
          break;
        case "third":
          index = 2;
          break;
        case "last":
          index = lastItems.length - 1;
          break;
        default:
          index = 0;
      }

      if (index < lastItems.length) {
        const foodId = lastItems[index];
        const food = allFoods.find((f) => f.id === foodId);

        if (food) {
          return {
            items: [food],
            confidence: 0.95,
            reason: `Resolved '${ref}' to: ${food.name}`,
          };
        }
      }
    }

    // Pattern 3: Multiple references (both, all, all of them)
    if (
      ["both", "all", "all of them", "all those", "everything"].includes(ref)
    ) {
      const count = ref === "both" ? 2 : lastItems.length;
      const foodIds = lastItems.slice(0, count);
      const foods = foodIds
        .map((id) => allFoods.find((f) => f.id === id))
        .filter((f): f is Food => f !== undefined);

      if (foods.length > 0) {
        return {
          items: foods,
          confidence: 0.85,
          reason: `Resolved '${ref}' to ${foods.length} items: ${foods.map((f) => f.name).join(", ")}`,
        };
      }
    }

    // Pattern 4: Numbered references (1, 2, 3, etc.)
    const numberMatch = ref.match(/^(\d+)(?:st|nd|rd|th)?$/);
    if (numberMatch) {
      const num = parseInt(numberMatch[1], 10);
      const index = num - 1; // Convert to 0-indexed

      if (index >= 0 && index < lastItems.length) {
        const foodId = lastItems[index];
        const food = allFoods.find((f) => f.id === foodId);

        if (food) {
          return {
            items: [food],
            confidence: 0.9,
            reason: `Resolved number ${num} to: ${food.name}`,
          };
        }
      }
    }

    // Pattern 5: Named reference (contains food name)
    // Try to match by food name
    const matchingFoods = lastItems
      .map((id) => allFoods.find((f) => f.id === id))
      .filter((f): f is Food => f !== undefined)
      .filter((f) => {
        const foodName = f.name.toLowerCase();
        return foodName.includes(ref) || ref.includes(foodName);
      });

    if (matchingFoods.length > 0) {
      return {
        items: matchingFoods,
        confidence: 0.8,
        reason: `Found matching items: ${matchingFoods.map((f) => f.name).join(", ")}`,
      };
    }

    // No match found
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
