import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY, INTENT_MODEL } from "../config/env.js";
import { cleanJSON } from "../utils/common.js";

// Import Message type from session service
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

// Initialize the Google GenAI client
const genai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

export interface ExtractedIntent {
  intent: "recommend" | "add_to_cart" | "details" | "checkout";
  filters: {
    category?: string | null;
    protein_level?: "high" | "medium" | "low" | null;
    carb_level?: "high" | "medium" | "low" | null;
    vegetarian?: boolean | null;
    spiceLevel?: string | null;
    budget?: number | null;
  };
  semantic_query?: string | null;
  item_reference?: string | null;
}

/**
 * Extract intent from user message with optional conversation history
 * @param userMessage - Current user message
 * @param conversationHistory - Optional conversation history for context
 */
export async function extractIntent(
  userMessage: string,
  conversationHistory?: Message[],
): Promise<ExtractedIntent> {
  // Build context from conversation history
  let historyContext = "";
  if (conversationHistory && conversationHistory.length > 0) {
    historyContext = "\n\nConversation History (for context):\n";
    conversationHistory.forEach((msg, index) => {
      const msgNumber = index + 1;
      historyContext += `${msgNumber}. ${msg.role.toUpperCase()}: ${msg.content}\n`;

      // Include results from assistant messages for better context
      if (msg.role === "assistant" && msg.results && msg.results.length > 0) {
        const itemNames = msg.results
          .slice(0, 3)
          .map((r: any) => r.name)
          .join(", ");
        if (itemNames) {
          historyContext += `   [Showed: ${itemNames}${msg.results.length > 3 ? "..." : ""}]\n`;
        }
      }
    });
    historyContext +=
      "\nUse this history to understand references like 'that', 'it', 'the first one', etc.\n";
  }

  const prompt = `
You are an AI intent extraction engine for a restaurant ordering system.

${historyContext}

Current user message: "${userMessage}"

Your job is to convert the CURRENT user message into STRICT JSON following EXACTLY this schema:

{
  "intent": "recommend" | "add_to_cart" | "details" | "checkout",
  "filters": {
    "category": string | null,
    "protein_level": "high" | "medium" | "low" | null,
    "carb_level": "high" | "medium" | "low" | null,
    "vegetarian": boolean | null,
    "spiceLevel": "mild" | "medium" | "spicy" | null,
    "budget": number | null
  },
  "semantic_query": string | null,
  "item_reference": string | null
}

Rules:
- Return ONLY raw JSON.
- Do NOT wrap in markdown code blocks.
- Do NOT add explanations.
- Do NOT omit keys - include all fields, set to null if not applicable.
- Never invent numeric thresholds.
- Use conversation history (if provided) to resolve references.
- If user asks generally for food suggestions → intent = "recommend".
- If user says "add", "order", "get two of that" → intent = "add_to_cart".
- If user asks for more info about a dish → intent = "details".
- If user says checkout/pay → intent = "checkout".
- For semantic_query: extract the core food preference query (e.g., "chicken high protein low carb" from "I need chicken-based lunch, high protein, low carb")
- For item_reference: capture references like "that", "it", "the first one", "both"

Examples:

User: "I need something for lunch, chicken-based, high protein, low carb"
{
  "intent": "recommend",
  "filters": {
    "category": "chicken",
    "protein_level": "high",
    "carb_level": "low",
    "vegetarian": false,
    "spiceLevel": null,
    "budget": null
  },
  "semantic_query": "chicken high protein low carb lunch",
  "item_reference": null
}

User: "What vegetarian options do you have?"
{
  "intent": "recommend",
  "filters": {
    "category": null,
    "protein_level": null,
    "carb_level": null,
    "vegetarian": true,
    "spiceLevel": null,
    "budget": null
  },
  "semantic_query": "vegetarian dishes",
  "item_reference": null
}

User: "Add two large pizzas to my cart"
{
  "intent": "add_to_cart",
  "filters": {
    "category": null,
    "protein_level": null,
    "carb_level": null,
    "vegetarian": null,
    "spiceLevel": null,
    "budget": null
  },
  "semantic_query": null,
  "item_reference": "two large pizzas"
}

User: "Tell me more about that" (after being shown items)
{
  "intent": "details",
  "filters": {
    "category": null,
    "protein_level": null,
    "carb_level": null,
    "vegetarian": null,
    "spiceLevel": null,
    "budget": null
  },
  "semantic_query": null,
  "item_reference": "that"
}

User: "Show me more like this"
{
  "intent": "recommend",
  "filters": {
    "category": null,
    "protein_level": null,
    "carb_level": null,
    "vegetarian": null,
    "spiceLevel": null,
    "budget": null
  },
  "semantic_query": "similar items",
  "item_reference": "this"
}

Now process this user message:
"${userMessage}"
`;

  try {
    // Generate content using the model
    const response = await genai.models.generateContent({
      model: INTENT_MODEL,
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      config: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    });

    // Extract text from response
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No response from model");
    }

    // Clean and parse JSON
    const cleaned = cleanJSON(text);
    const parsed: ExtractedIntent = JSON.parse(cleaned);

    // Validate the parsed result
    if (
      !parsed.intent ||
      !["recommend", "add_to_cart", "details", "checkout"].includes(
        parsed.intent,
      )
    ) {
      throw new Error("Invalid intent extracted");
    }

    // Ensure filters object exists
    if (!parsed.filters) {
      parsed.filters = {};
    }

    console.log("✅ Intent extracted successfully:", {
      intent: parsed.intent,
      has_filters: Object.keys(parsed.filters).length > 0,
      has_reference: !!parsed.item_reference,
      used_history: !!conversationHistory && conversationHistory.length > 0,
    });

    return parsed;
  } catch (error) {
    console.error("Intent extraction error:", error);

    // Return a default "recommend" intent on error
    return {
      intent: "recommend",
      filters: {},
      semantic_query: userMessage,
      item_reference: null,
    };
  }
}
