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
  intent: "recommend" | "add_to_cart" | "details" | "checkout" | "disambiguate";
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
  items?: string[] | null; // Multiple named items for add_to_cart (e.g., ["Grilled Chicken", "Caesar Salad"])
  quantity?: number | null; // Quantity for add_to_cart (e.g., 2 for "add two pizzas")
  message?: string | null; // Dynamic message to show to user
  follow_up_question?: string | null; // Follow-up question to suggest add-ons/sides
  requires_disambiguation?: boolean | null; // True when add_to_cart needs clarification
  secondary_intent?: "recommend" | null; // For compound requests (e.g., "add that and show me naan")
  secondary_query?: string | null; // Secondary search query for compound requests
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
  "intent": "recommend" | "add_to_cart" | "details" | "checkout" | "disambiguate",
  "filters": {
    "category": string | null,
    "protein_level": "high" | "medium" | "low" | null,
    "carb_level": "high" | "medium" | "low" | null,
    "vegetarian": boolean | null,
    "spiceLevel": "mild" | "medium" | "spicy" | null,
    "budget": number | null
  },
  "semantic_query": string | null,
  "item_reference": string | null,
  "items": string[] | null,
  "quantity": number | null,
  "message": string | null,
  "follow_up_question": string | null,
  "requires_disambiguation": boolean | null,
  "secondary_intent": "recommend" | null,
  "secondary_query": string | null
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
- For item_reference: capture references like "that", "it", "the first one", "both", "those"
- For items: When user names multiple specific items to add (e.g., "Add the Grilled Chicken, Caesar Salad, and Orange Juice"), extract as array of item names: ["Grilled Chicken", "Caesar Salad", "Orange Juice"]. Set to null for single items or references.
- For quantity: Extract number when user says "add two pizzas" or "get 3 of those". Set to null if not specified (defaults to 1).
- For message: Generate a friendly, dynamic message for "recommend" intent based on what the user is looking for. Be conversational and mention their specific preferences if any (e.g., "Here are some delicious vegetarian options for you!" or "I found some great high-protein chicken dishes!"). Set to null for other intents.
- For follow_up_question: For "recommend" intent, generate a conversational question suggesting sides, drinks, or add-ons that would complement the main dishes shown. Examples: "Would you like to add any sides or drinks?" or "Can I suggest some fresh juices or salads to go with that?" Set to null for other intents or if user is already looking for sides/drinks.
- For requires_disambiguation: Set to TRUE when user wants to add something but there's no conversation context AND the request is ambiguous (e.g., "Add a pizza" without prior context). In this case, intent should be "disambiguate" and semantic_query should contain what to search for. Set to null otherwise.
- For secondary_intent and secondary_query: When user combines requests like "add that and show me naan" or "I want that with some bread", set secondary_intent="recommend" and secondary_query with the additional item search (e.g., "naan", "bread"). Set to null for simple requests.

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
  "item_reference": null,
  "message": "Here are some delicious high-protein chicken dishes perfect for your lunch!",
  "follow_up_question": "Would you like to add any sides, salads, or drinks to complete your meal?"
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
  "item_reference": null,
  "message": "Here are some tasty vegetarian options for you!",
  "follow_up_question": "Can I suggest some refreshing beverages or sides to go with your meal?"
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
  "item_reference": "two large pizzas",
  "items": null,
  "quantity": 2,
  "message": null,
  "follow_up_question": null,
  "requires_disambiguation": null,
  "secondary_intent": null,
  "secondary_query": null
}

User: "Add the Grilled Chicken Breast, Caesar Salad, and Orange Juice to my cart"
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
  "item_reference": null,
  "items": ["Grilled Chicken Breast", "Caesar Salad", "Orange Juice"],
  "quantity": null,
  "message": null,
  "follow_up_question": null,
  "requires_disambiguation": null,
  "secondary_intent": null,
  "secondary_query": null
}

User: "Add a pizza" (no prior context about pizzas)
{
  "intent": "disambiguate",
  "filters": {
    "category": null,
    "protein_level": null,
    "carb_level": null,
    "vegetarian": null,
    "spiceLevel": null,
    "budget": null
  },
  "semantic_query": "pizza",
  "item_reference": "a pizza",
  "items": null,
  "quantity": 1,
  "message": "We have several pizzas! Here are our options:",
  "follow_up_question": "Which one would you like?",
  "requires_disambiguation": true,
  "secondary_intent": null,
  "secondary_query": null
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
  "item_reference": "that",
  "items": null,
  "quantity": null,
  "message": null,
  "follow_up_question": null,
  "requires_disambiguation": null,
  "secondary_intent": null,
  "secondary_query": null
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
  "item_reference": "this",
  "items": null,
  "quantity": null,
  "message": "Here are some similar dishes you might enjoy!",
  "follow_up_question": "Would you like any sides or beverages with these?",
  "requires_disambiguation": null,
  "secondary_intent": null,
  "secondary_query": null
}

User: "The Palak Paneer looks good. Can I get it with naan?" (compound request)
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
  "item_reference": "Palak Paneer",
  "items": null,
  "quantity": 1,
  "message": null,
  "follow_up_question": null,
  "requires_disambiguation": null,
  "secondary_intent": "recommend",
  "secondary_query": "naan"
}

User: "Add two of those" (referring to previously shown items)
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
  "item_reference": "those",
  "items": null,
  "quantity": 2,
  "message": null,
  "follow_up_question": null,
  "requires_disambiguation": null,
  "secondary_intent": null,
  "secondary_query": null
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
      ![
        "recommend",
        "add_to_cart",
        "details",
        "checkout",
        "disambiguate",
      ].includes(parsed.intent)
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
