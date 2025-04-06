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
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      viewport: { width: 1366, height: 768 }
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
      await page.waitForTimeout(5000);
      
      // Screenshot for debugging
      await page.screenshot({ path: 'zepto-search.png' });
      
      // Check for product cards
      const productExists = await page.locator('.product-card, [data-testid*="product"], .product-item').count() > 0;
      
      if (productExists) {
        // Get the first product
        const firstProduct = await page.locator('.product-card, [data-testid*="product"], .product-item').first();
        
        // Extract product details
        const productTitle = await firstProduct.locator('.product-title, .item-name, h3, h2').textContent() || `${query} (Zepto)`;
        
        // Extract price with better handling
        let price = 'Price not available';
        try {
          // Try multiple price selectors
          price = await firstProduct.locator('.product-price, .price, .amount, [data-testid*="price"]').textContent() || 'Price not available';
          price = price.trim();
        } catch (priceError) {
          console.log('Failed to extract price:', priceError);
        }
        
        // Extract quantity from title or dedicated element
        let quantity = 'Not specified';
        try {
          // Try to extract from product title
          const weightMatch = productTitle.match(/(\d+\s*[gGkKlLmM][gGlL]?\b|\d+\s*pieces|\d+\s*pack)/);
          if (weightMatch) {
            quantity = weightMatch[0].trim();
          } else {
            // Look for dedicated quantity elements
            const quantityElement = await firstProduct.locator('.product-weight, .product-qty, .weight, .size').textContent();
            if (quantityElement) {
              quantity = quantityElement.trim();
            }
          }
        } catch (quantityError) {
          console.log('Failed to extract quantity:', quantityError);
        }
        
        // Get high-resolution image
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
            imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `https://www.zeptonow.com${imageUrl}`;
          }
        } catch (imageError) {
          console.log('Failed to extract image URL:', imageError);
        }
        
        // Check if product is available
        const outOfStock = await firstProduct.locator('.out-of-stock, .sold-out, [data-testid*="out-of-stock"]').count() > 0;
        
        // Get estimated delivery time
        let deliveryEta = '10-20 min';
        try {
          deliveryEta = await page.locator('.delivery-time, .eta, [data-testid*="delivery"]').textContent() || '10-20 min';
        } catch (etaError) {
          console.log('Delivery time not found, using default value');
        }
        
        return {
          platform: 'Zepto',
          productTitle,
          price,
          quantity,
          available: !outOfStock,
          deliveryEta,
          imageUrl,
        };
      } else {
        // Try alternative product container selectors
        try {
          const altProductExists = await page.locator('[data-testid*="product-container"], .item-container').count() > 0;
          
          if (altProductExists) {
            const firstProduct = await page.locator('[data-testid*="product-container"], .item-container').first();
            
            const productTitle = await firstProduct.locator('h2, h3, .title').textContent() || `${query} (Zepto)`;
            const price = await firstProduct.locator('[data-testid*="price"], .price').textContent() || 'Price not available';
            const imageUrl = await firstProduct.locator('img').getAttribute('src') || '';
            
            return {
              platform: 'Zepto',
              productTitle,
              price: price.trim(),
              quantity: 'Not specified',
              available: true,
              deliveryEta: '10-20 min',
              imageUrl,
            };
          }
        } catch (altError) {
          console.log('Alternative product finder failed:', altError);
        }
        
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