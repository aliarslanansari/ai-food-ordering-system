import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY, INTENT_MODEL } from "../config/env.js";
import { cleanJSON } from "../utils/common.js";

// Initialize the Google GenAI client
const genai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
});

// const models = await genai.models.list();
// for await (const model of models) {
//   console.log(`Model: ${model.name}, Type: ${model.name}`);
// }

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

export async function extractIntent(
  userMessage: string,
): Promise<ExtractedIntent> {
  const prompt = `
You are an AI intent extraction engine for a restaurant ordering system.

Your job is to convert a user message into STRICT JSON following EXACTLY this schema:

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
- If user asks generally for food suggestions → intent = "recommend".
- If user says "add", "order", "get two of that" → intent = "add_to_cart".
- If user asks for more info about a dish → intent = "details".
- If user says checkout/pay → intent = "checkout".
- For semantic_query: extract the core food preference query (e.g., "chicken high protein low carb" from "I need chicken-based lunch, high protein, low carb")

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

    console.log("Raw LLM response:", text);

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
