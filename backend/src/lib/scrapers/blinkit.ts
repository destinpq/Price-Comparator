import axios from 'axios';
import { chromium } from 'playwright';

export interface ScrapedResult {
  platform: string;
  productTitle?: string;
  price?: string;
  available: boolean;
  deliveryEta?: string;
  imageUrl?: string;
  error?: string;
}

/**
 * Scrapes Blinkit website for product information
 * @param query - The product to search for
 * @param pincode - The delivery pincode
 * @returns Promise with scraped product data
 */
export async function scrapeBlinkit(query: string, pincode: string): Promise<ScrapedResult> {
  // Use headless browser for scraping
  const browser = await chromium.launch({ headless: true });
  
  try {
    console.log(`Scraping Blinkit for: ${query} in ${pincode}`);
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });
    
    const page = await context.newPage();
    
    // Navigate to Blinkit
    await page.goto('https://blinkit.com/');
    
    // Set pincode (this may need adjustment based on Blinkit's UI)
    try {
      // Look for pincode input and set it
      await page.waitForSelector('[data-test-id="delivery-location-input"]', { timeout: 10000 });
      await page.click('[data-test-id="delivery-location-input"]');
      await page.fill('input[placeholder="Enter your pincode"]', pincode);
      await page.press('input[placeholder="Enter your pincode"]', 'Enter');
      await page.waitForTimeout(2000); // Wait for pincode to be set
    } catch (error) {
      console.log('Could not set pincode, continuing anyway:', error);
    }
    
    // Search for the product
    await page.waitForSelector('input[type="search"]', { timeout: 10000 });
    await page.fill('input[type="search"]', query);
    await page.press('input[type="search"]', 'Enter');
    
    // Wait for search results
    await page.waitForTimeout(3000);
    
    // Extract first product information
    try {
      await page.waitForSelector('.product-card', { timeout: 10000 });
      
      // Get the first product
      const firstProduct = await page.locator('.product-card').first();
      
      // Extract product details
      const productTitle = await firstProduct.locator('.product__name').textContent() || `${query} (Blinkit)`;
      const price = await firstProduct.locator('.product__price').textContent() || 'Price not available';
      const imageUrl = await firstProduct.locator('img').getAttribute('src') || '';
      
      // Check if product is available
      const outOfStock = await firstProduct.locator('.product--out-of-stock').count() > 0;
      
      // Get delivery time if available
      let deliveryEta = 'Unknown';
      try {
        deliveryEta = await page.locator('.delivery-time__estimation').textContent() || '10-15 min';
      } catch (error) {
        console.log('Delivery time not found:', error);
      }
      
      return {
        platform: 'Blinkit',
        productTitle,
        price,
        available: !outOfStock,
        deliveryEta,
        imageUrl,
      };
    } catch (error) {
      console.error('Failed to extract product information:', error);
      
      // Return a fallback response
      return {
        platform: 'Blinkit',
        productTitle: `${query} (Blinkit)`,
        available: false,
        error: 'Product not found',
      };
    }
  } catch (error) {
    console.error('Blinkit scraping error:', error);
    return {
      platform: 'Blinkit',
      available: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await browser.close();
  }
} 