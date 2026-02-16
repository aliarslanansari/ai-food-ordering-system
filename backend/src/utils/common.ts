/**
 * Clean JSON string by removing markdown code blocks and extra whitespace
 * @param text - Raw text that might contain JSON
 * @returns Cleaned JSON string
 */
export function cleanJSON(text: string): string {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "");

  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();

  // Remove any text before first { or [
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");

  let startIndex = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIndex = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIndex = firstBrace;
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
  }

  if (startIndex > 0) {
    cleaned = cleaned.substring(startIndex);
  }

  // Remove any text after last } or ]
  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");

  let endIndex = -1;
  if (lastBrace !== -1 && lastBracket !== -1) {
    endIndex = Math.max(lastBrace, lastBracket);
  } else if (lastBrace !== -1) {
    endIndex = lastBrace;
  } else if (lastBracket !== -1) {
    endIndex = lastBracket;
  }

  if (endIndex !== -1 && endIndex < cleaned.length - 1) {
    cleaned = cleaned.substring(0, endIndex + 1);
  }

  return cleaned;
}

/**
 * Safely parse JSON with error handling
 * @param text - JSON string to parse
 * @param defaultValue - Default value to return on error
 * @returns Parsed object or default value
 */
export function safeJSONParse<T>(text: string, defaultValue: T): T {
  try {
    const cleaned = cleanJSON(text);
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error("JSON parse error:", error);
    return defaultValue;
  }
}

/**
 * Build full image URL by prepending CDN URL to the image path
 * Uses URL API to ensure proper slash handling (no missing or double slashes)
 * @param imagePath - The relative image path (e.g., "dishes/butter-chicken")
 * @param cdnUrl - The CDN base URL (e.g., "https://ik.imagekit.io/aliarslanansari/ai-food-ordering-system/")
 * @returns Full image URL
 */
export function buildImageUrl(imagePath: string, cdnUrl: string): string {
  if (!cdnUrl) {
    return imagePath;
  }

  if (!imagePath) {
    return "";
  }

  // Use URL API to properly concatenate paths
  try {
    const baseUrl = new URL(cdnUrl);
    // Remove leading slash from imagePath if present to avoid double slashes
    const cleanPath = imagePath.startsWith("/")
      ? imagePath.slice(1)
      : imagePath;
    // Remove trailing slash from pathname if present
    const cleanPathname = baseUrl.pathname.endsWith("/")
      ? baseUrl.pathname.slice(0, -1)
      : baseUrl.pathname;

    baseUrl.pathname = `${cleanPathname}/${cleanPath}`;
    return baseUrl.toString();
  } catch (error) {
    // Fallback: manual concatenation with slash handling
    const base = cdnUrl.endsWith("/") ? cdnUrl.slice(0, -1) : cdnUrl;
    const path = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
    return `${base}/${path}`;
  }
}
