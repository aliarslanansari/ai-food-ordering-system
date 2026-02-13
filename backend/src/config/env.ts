import dotenv from "dotenv";
dotenv.config();

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL || "gemini-embedding-001";

export const INTENT_MODEL = process.env.INTENT_MODEL || "gemini-2.0-flash-exp";

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing in environment variables");
}
