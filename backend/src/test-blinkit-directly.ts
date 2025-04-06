/**
 * Direct test for Blinkit scraper
 * 
 * Run with:
 * npx ts-node src/test-blinkit-directly.ts
 */

import { scrapeBlinkit } from "./lib/scrapers/blinkit";

async function testBlinkit() {
  try {
    console.log("Testing Blinkit scraper with pincode...");
    
    // Use a test query and pincode
    const result = await scrapeBlinkit("milk", "500034");
    
    console.log("Result:", JSON.stringify(result, null, 2));
    
    // Validate fields
    console.log("\nValidation:");
    console.log("- Platform:", result.platform);
    console.log("- Product Title:", result.productTitle || "Not available");
    console.log("- Price:", result.price || "Not available");
    console.log("- Original Price:", result.originalPrice || "Not available");
    console.log("- Discount:", result.discount || "Not available");
    console.log("- Quantity:", result.quantity || "Not available");
    console.log("- Available:", result.available);
    console.log("- Delivery ETA:", result.deliveryEta || "Not available");
    
    console.log("\nTest passed!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testBlinkit(); 