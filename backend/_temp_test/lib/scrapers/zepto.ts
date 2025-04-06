import { chromium, Locator } from 'playwright';
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
    console.log(`Scraping Zepto for: "${query}" in ${pincode}`);
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      viewport: { width: 1366, height: 768 }
    });
    
    const page = await context.newPage();
    
    // Navigate to Zepto
    await page.goto('https://www.zeptonow.com/');
    
    // Set location/pincode with improved handling
    try {
      // Handle location popup with multiple selector options
      const locationInputSelectors = [
        'input[placeholder*="Enter your location"]',
        'input[placeholder*="Search for your location"]',
        'input[data-testid*="location"]',
        'input[class*="location-input"]',
        '.location-box input'
      ];
      
      for (const selector of locationInputSelectors) {
        const hasInput = await page.locator(selector).count() > 0;
        if (hasInput) {
          await page.fill(selector, pincode);
          console.log(`Set location with selector: ${selector}`);
          break;
        }
      }
      
      // Wait for location suggestions to appear
      await page.waitForTimeout(1500);
      
      // Try multiple strategies to select the first suggestion
      try {
        // Try clicking on first suggestion
        const suggestionSelector = '.location-suggestions, [data-testid*="suggestion"], .search-results-container li';
        await page.click(suggestionSelector);
      } catch (_unused) {
        // If clicking fails, try pressing arrow down then enter
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }
      
      // Wait for location to be set
      await page.waitForTimeout(2500);
      
      // Verify that location was set correctly
      try {
        const locationDisplayed = await page.locator('.delivery-address, .location-display, [data-testid*="location"]').textContent();
        console.log(`Location displayed after setting: ${locationDisplayed}`);
      } catch (_unused) {
        // Continue even if we can't verify
      }
    } catch (error) {
      console.log('Could not set location, continuing anyway:', error);
    }
    
    // Normalize search query
    const normalizedQuery = query.toLowerCase().trim();
    console.log(`Normalized search query: "${normalizedQuery}"`);
    
    // Search for product with improved selector handling
    try {
      // Try multiple search input selectors
      const searchInputSelectors = [
        'input[placeholder*="Search"]',
        '[data-testid*="search-input"]',
        '.search-bar input',
        'input[type="search"]'
      ];
      
      let searchFound = false;
      for (const selector of searchInputSelectors) {
        const hasSearch = await page.locator(selector).count() > 0;
        if (hasSearch) {
          await page.fill(selector, normalizedQuery);
          await page.press(selector, 'Enter');
          searchFound = true;
          console.log(`Used search selector: ${selector}`);
          break;
        }
      }
      
      if (!searchFound) {
        throw new Error('Could not find search input');
      }
      
      // Wait for search results
      await page.waitForTimeout(5000);
      
      // Screenshot for debugging
      await page.screenshot({ path: `zepto-search-${normalizedQuery.replace(/\s+/g, '-')}.png` });
      
      // Check for product cards with multiple possible selectors
      // Include both traditional and possible Tailwind-like selectors
      const productSelectors = [
        '.product-card',
        '[data-testid*="product"]',
        '.product-item',
        '.item-container',
        // Tailwind-style selectors (that Zepto might adopt)
        '[class*="tw-relative"][class*="tw-flex"][class*="tw-flex-col"]',
        '[class*="tw-"]' // Very broad selector to catch any Tailwind elements
      ];
      
      let products: Locator[] = [];
      let productSelector = '';
      
      // Try each selector
      for (const selector of productSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          products = await page.locator(selector).all();
          productSelector = selector;
          console.log(`Found ${count} products with selector: ${selector}`);
          break;
        }
      }
      
      if (products.length === 0) {
        throw new Error(`No products found for "${normalizedQuery}"`);
      }
      
      // Find the best matching product
      let selectedProduct: Locator | null = null;
      let bestMatchScore = 0;
      
      // Try to find the best match by looking at product titles
      for (const product of products) {
        // Try multiple selectors for title, including potential Tailwind classes
        const titleSelectors = [
          '.product-title', '.item-name', 'h3', 'h2', '.title',
          // Potential Tailwind classes
          '[class*="tw-text-"][class*="tw-font-semibold"]',
          '[class*="tw-font-semibold"]'
        ];
        
        let title = '';
        for (const selector of titleSelectors) {
          const hasTitle = await product.locator(selector).count() > 0;
          if (hasTitle) {
            title = await product.locator(selector).textContent() || '';
            break;
          }
        }
        
        if (!title) continue;
        
        const titleLower = title.toLowerCase();
        console.log(`Candidate product: "${title}"`);
        
        // Calculate match score based on title relevance
        let score = 0;
        
        // Exact match is best
        if (titleLower.includes(normalizedQuery)) {
          score += 100;
        }
        
        // Check for query words in title
        const queryWords = normalizedQuery.split(/\s+/);
        for (const word of queryWords) {
          if (word.length > 2 && titleLower.includes(word)) {
            score += 10;
          }
        }
        
        // Improved category-specific matching
        if (normalizedQuery.includes('milk')) {
          // Boost milk scores for dairy terms
          if (titleLower.includes('dairy') || titleLower.includes('toned') || 
              titleLower.includes('full cream') || titleLower.includes('skimmed')) {
            score += 30;
          }
          
          // Avoid wrong products
          if (titleLower.includes('onion') || titleLower.includes('tomato')) {
            score -= 50;
          }
        }
        
        console.log(`Score for "${title}": ${score}`);
        
        // Update best match if this has a higher score
        if (score > bestMatchScore) {
          bestMatchScore = score;
          selectedProduct = product;
        }
      }
      
      // If no good match found, use first product
      if (!selectedProduct || bestMatchScore < 10) {
        console.log(`No good match found, using first product`);
        selectedProduct = products[0];
      }
      
      // Extract product details
      // Try multiple selectors for product title, including Tailwind possibilities
      let productTitle = '';
      const titleSelectors = [
        '.product-title', '.item-name', 'h3', 'h2', '.title',
        // Potential Tailwind selectors
        '[class*="tw-text-"][class*="tw-font-semibold"]',
        '[class*="tw-font-semibold"]'
      ];
      
      for (const selector of titleSelectors) {
        const hasTitle = await selectedProduct.locator(selector).count() > 0;
        if (hasTitle) {
          productTitle = await selectedProduct.locator(selector).textContent() || '';
          break;
        }
      }
      
      if (!productTitle) {
        productTitle = `${query} (Zepto)`;
      }
      
      console.log(`Selected product: "${productTitle}"`);
      
      // Extract price with better handling including Tailwind possibilities
      let price = 'Price not available';
      let originalPrice = '';
      try {
        // Try multiple price selectors, including Tailwind possibilities
        const priceSelectors = [
          '.product-price', '.price', '.amount', '[data-testid*="price"]',
          // Potential Tailwind selectors
          '[class*="tw-text-"][class*="tw-font-semibold"]',
          '[class*="tw-text-"]'
        ];
        
        for (const selector of priceSelectors) {
          const hasPrice = await selectedProduct.locator(selector).count() > 0;
          if (hasPrice) {
            price = await selectedProduct.locator(selector).textContent() || 'Price not available';
            price = price.trim();
            break;
          }
        }
        
        // Try to get original price with strikethrough
        const strikethroughSelectors = [
          '.old-price', '.original-price', '.strikethrough', '.mrp',
          // Potential Tailwind selector
          '[class*="tw-line-through"]'
        ];
        
        for (const selector of strikethroughSelectors) {
          const hasStrikethrough = await selectedProduct.locator(selector).count() > 0;
          if (hasStrikethrough) {
            originalPrice = await selectedProduct.locator(selector).textContent() || '';
            originalPrice = originalPrice.trim();
            break;
          }
        }
      } catch (priceError) {
        console.log('Failed to extract price:', priceError);
      }
      
      // Extract quantity from title or dedicated element
      let quantity = 'Not specified';
      try {
        // Try with multiple quantity selectors, including potential Tailwind
        const quantitySelectors = [
          '.product-weight', '.product-qty', '.weight', '.size',
          // Potential Tailwind selectors
          '[class*="tw-text-"][class*="tw-font-medium"]',
          '[class*="tw-text-"]'
        ];
        
        for (const selector of quantitySelectors) {
          const hasQuantity = await selectedProduct.locator(selector).count() > 0;
          if (hasQuantity) {
            quantity = await selectedProduct.locator(selector).textContent() || 'Not specified';
            quantity = quantity.trim();
            break;
          }
        }
        
        // If no quantity found, try to extract from title
        if (quantity === 'Not specified') {
          const weightMatch = productTitle.match(/(\d+\s*[gGkKlLmM][gGlL]?\b|\d+\s*pieces|\d+\s*pack|\d+\s*ml|\d+\s*l|\d+\s*kg|\d+\s*gm)/i);
          if (weightMatch) {
            quantity = weightMatch[0].trim();
          }
        }
      } catch (quantityError) {
        console.log('Failed to extract quantity:', quantityError);
      }
      
      // Get high-resolution image with improved handling
      let imageUrl = '';
      try {
        // Try different image selectors
        imageUrl = await selectedProduct.locator('img').getAttribute('src') || '';
        
        // If image URL is lazy-loaded, try data attributes
        if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('lazy')) {
          const imgElement = await selectedProduct.locator('img').first();
          
          // Try multiple data attributes for lazy loading
          for (const attr of ['data-src', 'data-lazy-src', 'data-original', 'data-lazy']) {
            const attrValue = await imgElement.getAttribute(attr);
            if (attrValue) {
              imageUrl = attrValue;
              break;
            }
          }
        }
        
        // Ensure we have a full URL
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `https://www.zeptonow.com${imageUrl}`;
        }
      } catch (imageError) {
        console.log('Failed to extract image URL:', imageError);
      }
      
      // Check if product is available with multiple selectors
      let available = true;
      try {
        const outOfStockSelectors = [
          '.out-of-stock', '.sold-out', '[data-testid*="out-of-stock"]',
          // Potential Tailwind selectors
          '[class*="tw-text-"][class*="out-of-stock"]'
        ];
        
        for (const selector of outOfStockSelectors) {
          const isOutOfStock = await selectedProduct.locator(selector).count() > 0;
          if (isOutOfStock) {
            available = false;
            break;
          }
        }
      } catch (availabilityError) {
        console.log('Failed to determine availability:', availabilityError);
      }
      
      // Get estimated delivery time
      let deliveryEta = '10-20 min';
      try {
        const etaSelectors = [
          '.delivery-time', '.eta', '[data-testid*="delivery"]',
          // Potential Tailwind selectors
          '[class*="tw-text-"][class*="tw-font-bold"]'
        ];
        
        for (const selector of etaSelectors) {
          const hasEta = await page.locator(selector).count() > 0;
          if (hasEta) {
            deliveryEta = await page.locator(selector).textContent() || '10-20 min';
            deliveryEta = deliveryEta.trim();
            break;
          }
        }
      } catch (etaError) {
        console.log('Delivery time not found, using default value');
      }
      
      // Look for discount
      let discount = '';
      try {
        const discountSelectors = [
          '.discount', '.off', '.percent-off',
          // Potential Tailwind selectors
          '[class*="tw-text-"][class*="tw-absolute"]'
        ];
        
        for (const selector of discountSelectors) {
          const hasDiscount = await selectedProduct.locator(selector).count() > 0;
          if (hasDiscount) {
            discount = await selectedProduct.locator(selector).textContent() || '';
            if (discount.includes('%')) {
              discount = discount.trim();
              break;
            }
          }
        }
      } catch (discountError) {
        console.log('Failed to extract discount:', discountError);
      }
      
      return {
        platform: 'Zepto',
        productTitle,
        price,
        quantity,
        available,
        deliveryEta,
        imageUrl,
        originalPrice,
        discount
      };
    } catch (searchError) {
      console.error('Failed to search for product:', searchError);
      
      return {
        platform: 'Zepto',
        productTitle: `${query} (Zepto)`,
        available: false,
        error: searchError instanceof Error ? searchError.message : 'Failed to search for product',
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