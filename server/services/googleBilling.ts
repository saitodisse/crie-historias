import memoizee from "memoizee";
import { GoogleAuth } from "google-auth-library";

interface BillingSku {
  name: string;
  skuId: string;
  description: string;
  category: {
    serviceDisplayName: string;
    resourceFamily: string;
    resourceGroup: string;
    usageType: string;
  };
  serviceRegions: string[];
  pricingInfo: Array<{
    effectiveTime: string;
    summary: string;
    pricingExpression: {
      usageUnit: string;
      usageUnitDescription: string;
      baseUnit: string;
      baseUnitDescription: string;
      baseUnitConversionFactor: number;
      displayPriceUnits: number;
      tieredRates: Array<{
        startUsageAmount: number;
        unitPrice: {
          currencyCode: string;
          units: string;
          nanos: number;
        };
      }>;
    };
  }>;
}

// Map of SKU description patterns to model IDs
const MODEL_MAPPING: Record<string, string> = {
  "Gemini 1.5 Pro": "gemini-1.5-pro",
  "Gemini 1.5 Flash": "gemini-1.5-flash",
  "Gemini 1.0 Pro": "gemini-pro",
  "Gemini 1.5 Flash-8B": "gemini-1.5-flash-8b",
  "Gemini 2.0 Flash": "gemini-2.0-flash",
  "Gemini 2.0 Flash-Lite": "gemini-2.0-flash-lite",
  "Gemini 2.0 Flash Lite": "gemini-2.0-flash-lite",
  "Gemini 3.1 Pro Preview": "gemini-3.1-pro-preview",
  "Gemini 3 Pro Preview": "gemini-3-pro-preview",
  "Gemini 3 Flash Preview": "gemini-3-flash-preview",
  "Nano Banana Pro": "gemini-3-pro-image-preview",
  "Gemini Flash Latest": "gemini-flash-latest",
  "Gemini Flash-Lite Latest": "gemini-flash-lite-latest",
  "Imagen 4": "imagen-4.0-generate-001",
  "Imagen 4 Ultra": "imagen-4.0-ultra-generate-001",
};

/**
 * Service to interact with Google Cloud Billing Catalog API
 * Supports both API Key (User) and Service Account (Server) authentication.
 */
export class GoogleBillingService {
  private static VERTEX_AI_SERVICE_ID = "DA34-6C6A-8716"; // Vertex AI Service ID

  /**
   * Fetches and parses Gemini pricing from Google Cloud Billing API
   * Priority: Public API Key -> Service Account (if configured)
   */
  static getGeminiPricing = memoizee(
    async (userApiKey?: string | null): Promise<Record<string, string>> => {
      try {
        console.log("[GoogleBillingService] Fetching SKUs for Vertex AI...");

        let url = "";
        let authHeaders: HeadersInit = {};

        // Strategy A: Use User API Key if provided
        if (userApiKey) {
          console.log("[GoogleBillingService] Using User API Key strategy.");
          url = `https://cloudbilling.googleapis.com/v1/services/${this.VERTEX_AI_SERVICE_ID}/skus?key=${userApiKey}`;
        }

        // Strategy B: Use Server Service Account if available (and no API Key or fallback needed)
        // Note: For now, if API key is missing, we try Service Account.
        // We can also make Service Account the PRIMARY strategy if configured, as it's more reliable for billing data.
        const hasServiceAccount = !!(
          process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
        );

        if (!userApiKey && hasServiceAccount) {
          console.log("[GoogleBillingService] Using Service Account strategy.");
          const auth = new GoogleAuth({
            credentials: {
              client_email: process.env.GOOGLE_CLIENT_EMAIL,
              private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(
                /\\n/g,
                "\n"
              ), // Fix newlines if escaped
              project_id: process.env.GOOGLE_PROJECT_ID,
            },
            scopes: [
              "https://www.googleapis.com/auth/cloud-billing.readonly",
              "https://www.googleapis.com/auth/cloud-platform",
            ],
          });
          const client = await auth.getClient();
          const token = await client.getAccessToken();

          url = `https://cloudbilling.googleapis.com/v1/services/${this.VERTEX_AI_SERVICE_ID}/skus`;
          authHeaders = {
            Authorization: `Bearer ${token.token}`,
          };
        } else if (!userApiKey && !hasServiceAccount) {
          console.log(
            "[GoogleBillingService] No credentials available (User Key or Service Account). Returning empty."
          );
          return {};
        }

        const response = await fetch(url, { headers: authHeaders });
        if (!response.ok) {
          const error = await response.json();
          // If User Key failed (e.g. 403), we could fallback to Service Account here if we wanted to be robust.
          // For now, let's just log.
          throw new Error(
            `Cloud Billing API error: ${error.error?.message || response.statusText}`
          );
        }

        const data = await response.json();
        const skus: BillingSku[] = data.skus || [];

        const pricingMap: Record<string, { input?: string; output?: string }> =
          {};

        // 2. Process SKUs
        for (const sku of skus) {
          // Look for Gemini models in the description
          const modelMatch = Object.keys(MODEL_MAPPING).find((m) =>
            sku.description.includes(m)
          );
          if (!modelMatch) continue;

          const modelId = MODEL_MAPPING[modelMatch];
          const isInput = sku.description.toLowerCase().includes("input");
          const isOutput = sku.description.toLowerCase().includes("output");

          if (!isInput && !isOutput) continue;

          // Get price (taking the first tier usually works for these models)
          const rate =
            sku.pricingInfo[0]?.pricingExpression?.tieredRates[0]?.unitPrice;
          if (!rate) continue;

          const price = parseFloat(rate.units || "0") + (rate.nanos || 0) / 1e9;
          const currency = rate.currencyCode || "USD";
          const unit =
            sku.pricingInfo[0].pricingExpression.usageUnitDescription;

          // Format price string (e.g., "$1.25/1M tokens")
          const formattedPrice = `${currency === "USD" ? "$" : currency + " "}${price.toFixed(2)}/${unit.replace("per ", "").replace("1,000,000", "1M").replace("1,000", "1k")}`;

          if (!pricingMap[modelId]) pricingMap[modelId] = {};

          if (isInput) pricingMap[modelId].input = formattedPrice;
          if (isOutput) pricingMap[modelId].output = formattedPrice;
        }

        // 3. Final formatting
        const finalResults: Record<string, string> = {};
        for (const [modelId, prices] of Object.entries(pricingMap)) {
          if (prices.input && prices.output) {
            finalResults[modelId] =
              ` (In: ${prices.input} | Out: ${prices.output})`;
          } else if (prices.input || prices.output) {
            finalResults[modelId] = ` (${prices.input || prices.output})`;
          }
        }

        console.log(
          `[GoogleBillingService] Successfully fetched ${Object.keys(finalResults).length} model prices.`
        );
        return finalResults;
      } catch (error: any) {
        console.error(
          "[GoogleBillingService] Failed to fetch pricing:",
          error.message
        );
        return {}; // Return empty object on failure to allow fallback
      }
    },
    { promise: true, maxAge: 1000 * 60 * 60 * 24 } // Cache for 24 hours
  );
}
