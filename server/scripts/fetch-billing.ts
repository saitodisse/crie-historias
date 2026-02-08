import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleBillingService } from "../services/googleBilling";

// --- Load .env from project root ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function runBillingTest() {
  console.log("=== Google Cloud Billing Test ===");
  console.log("Checking environment...");

  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    console.log("✅ Service Account credentials found.");
  } else {
    console.log("❌ Service Account credentials MISSING in .env.");
    console.log(
      "   Required: GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_PROJECT_ID"
    );
  }

  console.log("\nAttempting to fetch Gemini Pricing...");

  try {
    const prices = await GoogleBillingService.getGeminiPricing();
    const count = Object.keys(prices).length;

    if (count > 0) {
      console.log(`\n✅ SUCCESS! Retrieved ${count} pricing entries.`);
      console.table(prices);
    } else {
      console.log("\n⚠️  No pricing data returned.");
      console.log("   Possible causes:");
      console.log(
        "   1. 'Cloud Billing API' is not enabled in Google Cloud Console."
      );
      console.log("   2. Service Account lacks permissions.");
      console.log("   3. Vertex AI Service ID is not visible/valid.");
    }
  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message);
    if (
      error.message.includes("404") ||
      error.message.includes("Entity was not found")
    ) {
      console.log(
        "\n💡 TIP: Please ensure 'Cloud Billing API' is ENABLED for your project."
      );
      console.log(
        "   Link: https://console.cloud.google.com/apis/library/cloudbilling.googleapis.com"
      );
    }
  }
}

runBillingTest();
