import { chromium } from 'playwright';
import { ScrapedResult } from './blinkit';

/**
 * Scrapes JioMart website for product information
 * @param query - The product to search for
 * @param pincode - The delivery pincode
 * @returns Promise with scraped product data
 */
export async function scrapeJioMart(query: string, pincode: string): Promise<ScrapedResult> {
  // Use headless browser for scraping
  const browser = await chromium.launch({ headless: true });
  
  try {
    console.log(`Scraping JioMart for: ${query} in ${pincode}`);
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });
    
    const page = await context.newPage();
    
    // Navigate to JioMart
    await page.goto('https://www.jiomart.com/');
    
    // Set delivery location using pincode
    try {
      // Click on the pincode/location button
      await page.waitForSelector('.pincode_img', { timeout: 5000 });
      await page.click('.pincode_img');
      
      // Enter pincode
      await page.waitForSelector('input#rel_pincode', { timeout: 5000 });
      await page.fill('input#rel_pincode', pincode);
      
      // Submit pincode
      await page.click('button.apply_btn');
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log('Could not set pincode, continuing anyway:', error);
    }
    
    // Search for the product
    try {
      await page.waitForSelector('input#search', { timeout: 5000 });
      await page.fill('input#search', query);
      await page.press('input#search', 'Enter');
      
      // Wait for search results
      await page.waitForTimeout(5000);
      
      // Check if any products were found
      const productExists = await page.locator('.product-item').count() > 0;
      
      if (productExists) {
        // Get the first product
        const firstProduct = await page.locator('.product-item').first();
        
        // Extract product details
        const productTitle = await firstProduct.locator('.product-title').textContent() || `${query} (JioMart)`;
        const price = await firstProduct.locator('.price').textContent() || 'Price not available';
        const imageUrl = await firstProduct.locator('img.product-image').getAttribute('src') || '';
        
        // Check availability - JioMart usually marks unavailable products as "Out of Stock"
        const outOfStock = await firstProduct.locator('.out-of-stock').count() > 0;
        
        // Get delivery estimate - JioMart typically shows standard delivery times
        let deliveryEta = 'Standard Delivery (1-3 days)';
        try {
          deliveryEta = await firstProduct.locator('.delivery-info').textContent() || 'Standard Delivery (1-3 days)';
        } catch (etaError) {
          console.log('Delivery time not found:', etaError);
        }
        
        return {
          platform: 'JioMart',
          productTitle,
          price,
          available: !outOfStock,
          deliveryEta,
          imageUrl,
        };
      } else {
        return {
          platform: 'JioMart',
          productTitle: `${query} (JioMart)`,
          available: false,
          error: 'Product not found',
        };
      }
    } catch (searchError) {
      console.error('Failed to search for product:', searchError);
      
      return {
        platform: 'JioMart',
        productTitle: `${query} (JioMart)`,
        available: false,
        error: 'Failed to search for product',
      };
    }
  } catch (error) {
    console.error('JioMart scraping error:', error);
    return {
      platform: 'JioMart',
      available: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await browser.close();
  }
} 