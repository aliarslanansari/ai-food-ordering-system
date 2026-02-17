export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL || "gemini-embedding-001";

export const INTENT_MODEL = process.env.INTENT_MODEL || "gemini-2.0-flash-exp";

export const IMAGE_CDN_URL = process.env.IMAGE_CDN_URL || "";

// MongoDB Configuration
export const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/food_ordering";

if (!GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY is missing in environment variables: " +
      process.env.NODE_ENV,
  );
}
