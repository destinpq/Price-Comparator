// ES Module script to test Blinkit scraper
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawnSync } from 'child_process';
import { chromium } from 'playwright';

// Add globals declaration for linting
/* global console, process */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Run this with: node test-blinkit.mjs
async function main() {
  console.log('🧪 Testing Blinkit scraper directly...');
  
  // Execute scraper code through Next.js to properly handle TS imports
  const result = spawnSync('npx', [
    'ts-node', 
    '-e', 
    `
    import { scrapeBlinkit } from './src/lib/scrapers/blinkit.js';
    
    async function test() {
      try {
        console.log('Starting test for Blinkit scraper...');
        const result = await scrapeBlinkit('milk', '500034');
        console.log('Test result:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.error('Test error:', error);
      }
    }
    
    test();
    `
  ], { 
    cwd: __dirname,
    encoding: 'utf-8',
    env: {
      ...process.env,
      NODE_OPTIONS: '--experimental-specifier-resolution=node'
    }
  });
  
  if (result.error) {
    console.error('Error executing test:', result.error);
  }
  
  console.log('STDOUT:', result.stdout);
  console.log('STDERR:', result.stderr);
  
  console.log('✅ Test complete!');
}

// Run the main function
main().catch(err => console.error('Test failed:', err));

// Alternate method using direct browser automation
async function testWithBrowser() {
  const TEST_PRODUCT = 'milk';
  const TEST_PINCODE = '500034';
  
  // Use headless browser for scraping
  const browser = await chromium.launch({ headless: false }); // Set to false to see browser visually
  
  try {
    console.log(`Scraping Blinkit for: "${TEST_PRODUCT}" in ${TEST_PINCODE}`);
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Navigate to Blinkit
    await page.goto('https://blinkit.com/');
    
    // Set pincode
    try {
      // Look for pincode input and set it
      await page.waitForSelector('[data-test-id="delivery-location-input"]', { timeout: 10000 });
      await page.click('[data-test-id="delivery-location-input"]');
      
      // Wait for the pincode modal to fully appear
      await page.waitForSelector('input[placeholder="Enter your pincode"], input.pincode-input', { timeout: 5000 });
      
      // Clear existing pincode if any and fill with new pincode
      const pincodeInput = await page.locator('input[placeholder="Enter your pincode"], input.pincode-input');
      await pincodeInput.clear();
      await pincodeInput.fill(TEST_PINCODE);
      await page.press('input[placeholder="Enter your pincode"], input.pincode-input', 'Enter');
      
      // Click on confirm/submit button if available
      try {
        await page.waitForSelector('button[type="submit"], button.submit-button, button.btn-confirm', { timeout: 3000 });
        await page.click('button[type="submit"], button.submit-button, button.btn-confirm');
      } catch { 
        console.log('No confirmation button found, continuing with Enter key press');
      }
      
      // Wait longer for pincode to be set and location to update
      await page.waitForTimeout(3000);
      
      // Verify pincode was set
      try {
        const displayedPincode = await page.locator('.location-name, .delivery-address, [data-test-id="delivery-location-input"]').textContent();
        console.log(`Location display text: ${displayedPincode}`);
      } catch { 
        console.log('Could not verify pincode was set correctly');
      }
    } catch (error) {
      console.log('Could not set pincode, continuing anyway:', error);
    }
    
    // Normalize search query
    const normalizedQuery = TEST_PRODUCT.toLowerCase().trim();
    console.log(`Normalized search query: "${normalizedQuery}"`);
    
    // Search for the product
    await page.waitForSelector('input[type="search"]', { timeout: 10000 });
    await page.fill('input[type="search"]', normalizedQuery);
    await page.press('input[type="search"]', 'Enter');
    
    // Wait for search results
    await page.waitForTimeout(5000);
    
    // Take screenshot for debugging
    await page.screenshot({ path: `blinkit-search-${normalizedQuery.replace(/\s+/g, '-')}.png` });
    console.log('Screenshot saved as blinkit-search-milk.png');
    
    // Check if we're on a product listing page - updated selectors for Tailwind
    const productCount = await page.locator('.tw-relative.tw-flex.tw-h-full.tw-flex-col, [role="button"][id][style*="border-radius: 8px"], [tabindex="0"][role="button"][id]').count();
    console.log(`Found ${productCount} products for "${normalizedQuery}"`);
    
    if (productCount > 0) {
      // Get first few products titles to check what's showing - updated selectors for Tailwind
      const products = await page.locator('.tw-relative.tw-flex.tw-h-full.tw-flex-col, [role="button"][id][style*="border-radius: 8px"], [tabindex="0"][role="button"][id]').all();
      
      console.log('First 5 products:');
      for (let i = 0; i < Math.min(5, products.length); i++) {
        const product = products[i];
        const title = await product.locator('.tw-text-300.tw-font-semibold.tw-line-clamp-2, .tw-font-semibold').textContent() || 'Unknown';
        const price = await product.locator('.tw-text-200.tw-font-semibold').first().textContent() || 'Price not available';
        const quantity = await product.locator('.tw-text-200.tw-font-medium.tw-line-clamp-1').textContent() || 'Not specified';
        
        console.log(`${i+1}. "${title}" - ${price.trim()} - ${quantity.trim()}`);
        
        // Try to get discount if available
        try {
          const discount = await product.locator('.tw-absolute.tw-z-20 .tw-font-extrabold, .tw-text-050.tw-absolute.tw-z-20').textContent();
          if (discount) {
            console.log(`   Discount: ${discount.trim()}`);
          }
        } catch { 
          // No discount
        }
      }
    } else {
      console.log('No products found');
    }

    // Keep the browser open for 10 seconds to examine results
    console.log('Keeping browser open for 10 seconds to examine results...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Blinkit testing error:', error);
  } finally {
    await browser.close();
    console.log('Test completed, browser closed');
  }
}

// Uncomment to run browser test instead
// testWithBrowser().catch(console.error); 