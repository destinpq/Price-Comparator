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
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      viewport: { width: 1366, height: 768 }
    });
    
    const page = await context.newPage();
    
    // Navigate to JioMart
    await page.goto('https://www.jiomart.com/');
    
    // Set delivery location using pincode
    try {
      // Click on the pincode/location button
      await page.waitForSelector('.pincode_img, .delivery-location, .location-selector', { timeout: 5000 });
      await page.click('.pincode_img, .delivery-location, .location-selector');
      
      // Enter pincode
      await page.waitForSelector('input#rel_pincode, input[placeholder*="pincode"], input[name="pincode"]', { timeout: 5000 });
      await page.fill('input#rel_pincode, input[placeholder*="pincode"], input[name="pincode"]', pincode);
      
      // Submit pincode
      await page.click('button.apply_btn, button[type="submit"], .submit-pincode');
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log('Could not set pincode, continuing anyway:', error);
    }
    
    // Search for the product
    try {
      await page.waitForSelector('input#search, .search-input, input[placeholder*="Search"]', { timeout: 5000 });
      await page.fill('input#search, .search-input, input[placeholder*="Search"]', query);
      await page.press('input#search, .search-input, input[placeholder*="Search"]', 'Enter');
      
      // Wait for search results
      await page.waitForTimeout(5000);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'jiomart-search.png' });
      
      // Check if any products were found using multiple selectors
      const productExists = await page.locator('.product-item, .product-card, .sku-item, .product-box').count() > 0;
      
      if (productExists) {
        // Get the first product
        const firstProduct = await page.locator('.product-item, .product-card, .sku-item, .product-box').first();
        
        // Extract product details using multiple possible selectors
        const productTitle = await firstProduct.locator('.product-title, .name, .item-name, h2, h3').textContent() || `${query} (JioMart)`;
        
        // Extract price with better handling
        let price = 'Price not available';
        try {
          // Try multiple price selectors, looking for discounted price first then regular price
          price = await firstProduct.locator('.price, .discounted-price, .offer-price, .final-price').textContent() || 'Price not available';
          price = price.trim();
          
          // Clean up price text (remove extra text like "MRP" or "Offer Price")
          price = price.replace(/mrp|offer price|price/i, '').trim();
        } catch (priceError) {
          console.log('Failed to extract price:', priceError);
        }
        
        // Extract quantity information (often part of the title or in a separate element)
        let quantity = 'Not specified';
        try {
          // First try to find a dedicated quantity element
          const quantityText = await firstProduct.locator('.product-weight, .weight, .package-size, .quantity').textContent();
          if (quantityText) {
            quantity = quantityText.trim();
          } else {
            // Look for quantity in the product title
            const weightMatch = productTitle.match(/(\d+\s*[gGkKlLmM][gGlL]?\b|\d+\s*pieces|\d+\s*pack|\d+\s*x\s*\d+|\d+\s*(ml|ltr))/i);
            if (weightMatch) {
              quantity = weightMatch[0].trim();
            }
          }
        } catch (quantityError) {
          console.log('Failed to extract quantity:', quantityError);
        }
        
        // Get high-resolution image URL
        let imageUrl = '';
        try {
          // Try multiple image selectors
          imageUrl = await firstProduct.locator('img.product-image, img.sku-image, img[data-src], img.lazy').getAttribute('src') || '';
          
          // If image is lazy-loaded, try data attributes
          if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('lazy') || imageUrl.includes('default')) {
            imageUrl = await firstProduct.locator('img').getAttribute('data-src') || 
                      await firstProduct.locator('img').getAttribute('data-lazy') ||
                      await firstProduct.locator('img').getAttribute('data-original') || '';
          }
          
          // Ensure we have a full URL
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `https://www.jiomart.com${imageUrl}`;
          }
        } catch (imageError) {
          console.log('Failed to extract image URL:', imageError);
        }
        
        // Check availability with multiple selectors
        const outOfStock = await firstProduct.locator('.out-of-stock, .sold-out, .not-available').count() > 0;
        
        // Get delivery estimate - JioMart typically shows standard delivery times
        let deliveryEta = 'Standard Delivery (1-3 days)';
        try {
          const etaText = await firstProduct.locator('.delivery-info, .delivery-time, .edd-info').textContent();
          if (etaText) {
            deliveryEta = etaText.trim();
          }
        } catch (etaError) {
          console.log('Delivery time not found, using default value');
        }
        
        return {
          platform: 'JioMart',
          productTitle,
          price,
          quantity,
          available: !outOfStock,
          deliveryEta,
          imageUrl,
        };
      } else {
        // Try alternative product container selector
        try {
          const altSelector = '.product, .item, [data-sku]';
          const altProductExists = await page.locator(altSelector).count() > 0;
          
          if (altProductExists) {
            const firstProduct = await page.locator(altSelector).first();
            const productTitle = await firstProduct.locator('h2, h3, .title, .name').textContent() || `${query} (JioMart)`;
            const price = await firstProduct.locator('.price, [data-price]').textContent() || 'Price not available';
            const imageUrl = await firstProduct.locator('img').getAttribute('src') || '';
            
            return {
              platform: 'JioMart',
              productTitle,
              price: price.trim(),
              quantity: 'Not specified',
              available: true,
              deliveryEta: 'Standard Delivery (1-3 days)',
              imageUrl,
            };
          }
        } catch (altError) {
          console.log('Alternative product selector failed:', altError);
        }
        
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