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
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      viewport: { width: 1366, height: 768 }
    });
    
    const page = await context.newPage();
    
    // Navigate to BigBasket
    await page.goto('https://www.bigbasket.com/');
    
    // Set pincode/location
    try {
      // Look for location picker and set it
      await page.waitForSelector('.delivery-pin, [data-qa="locationSelector"], #divaddress', { timeout: 5000 });
      await page.click('.delivery-pin, [data-qa="locationSelector"], #divaddress');
      
      // Fill in the pincode
      await page.waitForSelector('input#areaselect, input[placeholder*="pincode"], input[name="pincode"], input[placeholder*="Delivery"]', { timeout: 5000 });
      await page.fill('input#areaselect, input[placeholder*="pincode"], input[name="pincode"], input[placeholder*="Delivery"]', pincode);
      await page.waitForTimeout(1000);
      
      // Select the first suggestion if available
      const hasSuggestions = await page.locator('.ui-menu-item, .suggestions div, .area-suggestions').count() > 0;
      if (hasSuggestions) {
        await page.click('.ui-menu-item, .suggestions div, .area-suggestions');
      }
      
      // Confirm location
      await page.click('button.btn-submit, [type="submit"], .confirm-location');
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log('Could not set location, continuing anyway:', error);
    }
    
    // Search for the product
    try {
      await page.waitForSelector('#input, .search-input, input[placeholder*="Search"]', { timeout: 5000 });
      await page.fill('#input, .search-input, input[placeholder*="Search"]', query);
      await page.press('#input, .search-input, input[placeholder*="Search"]', 'Enter');
      
      // Wait for search results
      await page.waitForTimeout(5000);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'bigbasket-search.png' });
      
      // Check if any products were found with multiple possible selectors
      const productExists = await page.locator('.product-item, .prod-deck, .product-card, li.item').count() > 0;
      
      if (productExists) {
        // Get the first product
        const firstProduct = await page.locator('.product-item, .prod-deck, .product-card, li.item').first();
        
        // Extract product details with multiple possible selectors
        const productTitle = await firstProduct.locator('.prod-name, .product-name, h3, .item-name').textContent() || `${query} (BigBasket)`;
        
        // Extract price with better handling
        let price = 'Price not available';
        try {
          // Try multiple selectors for price, prioritizing discounted/sale price
          const discountedPrice = await firstProduct.locator('.discounted-price, .sale-price, .SP, [data-qa="productPrice"]').textContent();
          const regularPrice = await firstProduct.locator('.price, .amount, .prod-price').textContent();
          
          price = (discountedPrice || regularPrice || 'Price not available').trim();
          
          // Clean up price text (remove currency symbol, commas, etc.)
          price = price.replace(/MRP:?|Price:?|\(.*\)/gi, '').trim();
        } catch (priceError) {
          console.log('Failed to extract price:', priceError);
        }
        
        // Extract quantity information with multiple approaches
        let quantity = 'Not specified';
        try {
          // First try dedicated quantity/weight elements
          const quantityText = await firstProduct.locator('.product-qty, .package-size, .weight, .pkg').textContent();
          if (quantityText) {
            quantity = quantityText.trim();
          } else {
            // Look for quantity in the product title
            const weightMatch = productTitle.match(/(\d+\s*[gGkKlLmM][gGlL]?\b|\d+\s*pieces|\d+\s*pack|\d+\s*x\s*\d+|\d+\s*(ml|ltr|L))/i);
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
          imageUrl = await firstProduct.locator('img.product-img, img.item-img, img.product-image, img.lazy').getAttribute('src') || '';
          
          // If image is lazy-loaded, try data attributes
          if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('lazy') || imageUrl.includes('default')) {
            imageUrl = await firstProduct.locator('img').getAttribute('data-src') || 
                      await firstProduct.locator('img').getAttribute('data-lazy') || 
                      await firstProduct.locator('img').getAttribute('data-original') || '';
          }
          
          // Ensure we have a full URL
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `https://www.bigbasket.com${imageUrl}`;
          }
        } catch (imageError) {
          console.log('Failed to extract image URL:', imageError);
        }
        
        // Check availability with multiple selectors
        const outOfStock = await firstProduct.locator('.out-of-stock, .sold-out, .not-available, .out_of_stock').count() > 0;
        
        // Get delivery estimate
        let deliveryEta = 'Same day delivery';
        try {
          const etaText = await firstProduct.locator('.delivery-info, .delivery-time, .eta').textContent();
          if (etaText) {
            deliveryEta = etaText.trim();
          }
        } catch (etaError) {
          console.log('Delivery time not found, using default value');
        }
        
        return {
          platform: 'BigBasket',
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
          const altSelector = '[data-qa="product"], .prod-card, .product, .item';
          const altProductExists = await page.locator(altSelector).count() > 0;
          
          if (altProductExists) {
            const firstProduct = await page.locator(altSelector).first();
            const productTitle = await firstProduct.locator('h3, h2, .name, .title').textContent() || `${query} (BigBasket)`;
            const price = await firstProduct.locator('[data-qa="productPrice"], .price, .amount').textContent() || 'Price not available';
            const imageUrl = await firstProduct.locator('img').getAttribute('src') || '';
            
            return {
              platform: 'BigBasket',
              productTitle,
              price: price.trim().replace(/MRP:?|Price:?/gi, '').trim(),
              quantity: 'Not specified',
              available: true,
              deliveryEta: 'Same day delivery',
              imageUrl,
            };
          }
        } catch (altError) {
          console.log('Alternative product selector failed:', altError);
        }
        
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