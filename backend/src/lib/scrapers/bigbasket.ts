import { chromium } from 'playwright';
import { ScrapedResult } from './blinkit';

/**
 * Scrapes BigBasket website for product information
 * @param query - The product to search for
 * @param pincode - The delivery pincode
 * @returns Promise with scraped product data
 */
export async function scrapeBigBasket(query: string, pincode: string): Promise<ScrapedResult> {
  // Use headless browser for scraping
  const browser = await chromium.launch({ headless: true });
  
  try {
    console.log(`Scraping BigBasket for: ${query} in ${pincode}`);
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });
    
    const page = await context.newPage();
    
    // Navigate to BigBasket
    await page.goto('https://www.bigbasket.com/');
    
    // Set pincode/location
    try {
      // Look for location picker and set it
      await page.waitForSelector('.delivery-pin', { timeout: 5000 });
      await page.click('.delivery-pin');
      
      // Fill in the pincode
      await page.waitForSelector('input#areaselect', { timeout: 5000 });
      await page.fill('input#areaselect', pincode);
      await page.waitForTimeout(1000);
      
      // Select the first suggestion
      await page.waitForSelector('.ui-menu-item', { timeout: 5000 });
      await page.click('.ui-menu-item');
      
      // Confirm location
      await page.click('button.btn-submit');
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log('Could not set location, continuing anyway:', error);
    }
    
    // Search for the product
    try {
      await page.waitForSelector('#input', { timeout: 5000 });
      await page.fill('#input', query);
      await page.press('#input', 'Enter');
      
      // Wait for search results
      await page.waitForTimeout(5000);
      
      // Check if any products were found
      const productExists = await page.locator('.product-item').count() > 0;
      
      if (productExists) {
        // Get the first product
        const firstProduct = await page.locator('.product-item').first();
        
        // Extract product details
        const productTitle = await firstProduct.locator('.prod-name').textContent() || `${query} (BigBasket)`;
        const price = await firstProduct.locator('.discounted-price').textContent() || 'Price not available';
        const imageUrl = await firstProduct.locator('img.product-img').getAttribute('src') || '';
        
        // Check availability
        const outOfStock = await firstProduct.locator('.out-of-stock').count() > 0;
        
        // Get delivery estimate
        let deliveryEta = 'Same day delivery';
        try {
          deliveryEta = await firstProduct.locator('.delivery-info').textContent() || 'Same day delivery';
        } catch (etaError) {
          console.log('Delivery time not found:', etaError);
        }
        
        return {
          platform: 'BigBasket',
          productTitle,
          price,
          available: !outOfStock,
          deliveryEta,
          imageUrl,
        };
      } else {
        return {
          platform: 'BigBasket',
          productTitle: `${query} (BigBasket)`,
          available: false,
          error: 'Product not found',
        };
      }
    } catch (searchError) {
      console.error('Failed to search for product:', searchError);
      
      return {
        platform: 'BigBasket',
        productTitle: `${query} (BigBasket)`,
        available: false,
        error: 'Failed to search for product',
      };
    }
  } catch (error) {
    console.error('BigBasket scraping error:', error);
    return {
      platform: 'BigBasket',
      available: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await browser.close();
  }
} 