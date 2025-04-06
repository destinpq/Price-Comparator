import { chromium } from 'playwright';
import { ScrapedResult } from './blinkit';

/**
 * Scrapes Zepto website for product information
 * @param query - The product to search for
 * @param pincode - The delivery pincode
 * @returns Promise with scraped product data
 */
export async function scrapeZepto(query: string, pincode: string): Promise<ScrapedResult> {
  // Use headless browser for scraping
  const browser = await chromium.launch({ headless: true });
  
  try {
    console.log(`Scraping Zepto for: ${query} in ${pincode}`);
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });
    
    const page = await context.newPage();
    
    // Navigate to Zepto
    await page.goto('https://www.zeptonow.com/');
    
    // Set location/pincode
    try {
      // Handle location popup if it appears
      await page.waitForSelector('input[placeholder*="Enter your location"]', { timeout: 5000 });
      await page.fill('input[placeholder*="Enter your location"]', pincode);
      await page.waitForTimeout(1000);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log('Could not set location, continuing anyway:', error);
    }
    
    // Search for product
    try {
      await page.waitForSelector('input[placeholder*="Search"]', { timeout: 5000 });
      await page.fill('input[placeholder*="Search"]', query);
      await page.press('input[placeholder*="Search"]', 'Enter');
      
      // Wait for search results
      await page.waitForTimeout(3000);
      
      // Check for product cards
      const productExists = await page.locator('.product-card').count() > 0;
      
      if (productExists) {
        // Get the first product
        const firstProduct = await page.locator('.product-card').first();
        
        // Extract product details
        const productTitle = await firstProduct.locator('.product-title').textContent() || `${query} (Zepto)`;
        const price = await firstProduct.locator('.product-price').textContent() || 'Price not available';
        const imageUrl = await firstProduct.locator('img').getAttribute('src') || '';
        
        // Check if product is available
        const outOfStock = await firstProduct.locator('.out-of-stock').count() > 0;
        
        // Get estimated delivery time
        let deliveryEta = '10-20 min';
        try {
          deliveryEta = await page.locator('.delivery-time').textContent() || '10-20 min';
        } catch (etaError) {
          console.log('Delivery time not found:', etaError);
        }
        
        return {
          platform: 'Zepto',
          productTitle,
          price,
          available: !outOfStock,
          deliveryEta,
          imageUrl,
        };
      } else {
        return {
          platform: 'Zepto',
          productTitle: `${query} (Zepto)`,
          available: false,
          error: 'Product not found',
        };
      }
    } catch (searchError) {
      console.error('Failed to search for product:', searchError);
      
      return {
        platform: 'Zepto',
        productTitle: `${query} (Zepto)`,
        available: false,
        error: 'Failed to search for product',
      };
    }
  } catch (error) {
    console.error('Zepto scraping error:', error);
    return {
      platform: 'Zepto',
      available: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await browser.close();
  }
} 