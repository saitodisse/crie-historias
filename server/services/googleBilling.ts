// Map of fixed prices
const STATIC_PRICING: Record<string, string> = {
  "gemini-1.5-pro": " (In: $1.25 | Out: $5.00)",
  "gemini-1.5-flash": " (In: $0.075 | Out: $0.30)",
  "gemini-pro": " (In: $0.50 | Out: $1.50)",
  "gemini-1.5-flash-8b": " (In: $0.0375 | Out: $0.15)",
  "gemini-2.0-flash": " (In: $0.10 | Out: $0.40)",
  "gemini-2.0-flash-lite": " (In: $0.075 | Out: $0.30)",
  "gemini-3.1-pro-preview": " (In: $2.00 | Out: $12.00)",
  "gemini-3-pro-preview": " (In: $2.00 | Out: $12.00)",
  "gemini-3-flash-preview": " (In: $0.50 | Out: $3.00)",
  "gemini-3-pro-image-preview": " (In: $2.00 | Out: $0.134/img)",
  "gemini-flash-latest": " (In: $0.30 | Out: $2.50)",
  "gemini-flash-lite-latest": " (In: $0.10 | Out: $0.40)",
  "imagen-4.0-generate-001": " (Preço sob consulta)",
  "imagen-4.0-ultra-generate-001": " (Preço sob consulta)",
};

/**
 * Service to provide Google Cloud Billing / Pricing
 * Now returning static fallback prices.
 */
export class GoogleBillingService {
  /**
   * Returns statically defined pricing for Gemini models.
   */
  static getGeminiPricing = async (
    userApiKey?: string | null
  ): Promise<Record<string, string>> => {
    return STATIC_PRICING;
  };
}
