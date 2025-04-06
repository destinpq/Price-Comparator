import axios from 'axios';
import { chromium } from 'playwright';

export interface ScrapedResult {
  platform: string;
  productTitle?: string;
  price?: string;
  quantity?: string;
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
      viewport: { width: 1280, height: 720 }
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
    await page.waitForTimeout(5000);
    
    // Extract first product information
    try {
      await page.waitForSelector('.product-card', { timeout: 10000 });
      
      // Get the first product
      const firstProduct = await page.locator('.product-card').first();
      
      // Extract product details
      const productTitle = await firstProduct.locator('.product__name').textContent() || `${query} (Blinkit)`;
      
      // Extract price - be more precise with selectors and remove currency symbol
      let priceText = await firstProduct.locator('.product__price').textContent() || 'Price not available';
      let price = priceText.trim();
      
      // Extract quantity information (often part of the title or in a separate element)
      let quantity = 'Not specified';
      try {
        // Look for quantity in product name or dedicated element
        const weightMatch = productTitle.match(/(\d+\s*[gGkKlLmM][gGlL]?\b|\d+\s*pieces|\d+\s*pack)/);
        if (weightMatch) {
          quantity = weightMatch[0].trim();
        } else {
          // Try to find quantity in a dedicated element
          const quantityElement = await firstProduct.locator('.product__qty, .product__weight').textContent();
          if (quantityElement) {
            quantity = quantityElement.trim();
          }
        }
      } catch (quantityError) {
        console.log('Failed to extract quantity:', quantityError);
      }
      
      // Get high-resolution image URL
      let imageUrl = '';
      try {
        // Try different image selectors
        imageUrl = await firstProduct.locator('img').getAttribute('src') || '';
        
        // If image URL is lazy-loaded, try data attributes
        if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('lazy')) {
          imageUrl = await firstProduct.locator('img').getAttribute('data-src') || 
                     await firstProduct.locator('img').getAttribute('data-lazy-src') || 
                     await firstProduct.locator('img').getAttribute('data-original') || '';
        }
        
        // Ensure we have a full URL
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `https://blinkit.com${imageUrl}`;
        }
      } catch (imageError) {
        console.log('Failed to extract image URL:', imageError);
      }
      
      // Check if product is available
      const outOfStock = await firstProduct.locator('.product--out-of-stock').count() > 0;
      
      // Get delivery time if available
      let deliveryEta = '10-15 min';
      try {
        deliveryEta = await page.locator('.delivery-time__estimation').textContent() || '10-15 min';
      } catch (error) {
        console.log('Delivery time not found, using default value');
      }
      
      return {
        platform: 'Blinkit',
        productTitle,
        price,
        quantity,
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