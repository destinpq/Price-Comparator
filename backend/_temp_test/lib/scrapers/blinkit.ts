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
  originalPrice?: string;
  discount?: string;
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
    console.log(`Scraping Blinkit for: "${query}" in ${pincode}`);
    
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
      
      // Wait for the pincode modal to fully appear
      await page.waitForSelector('input[placeholder="Enter your pincode"], input.pincode-input', { timeout: 5000 });
      
      // Clear existing pincode if any and fill with new pincode
      const pincodeInput = await page.locator('input[placeholder="Enter your pincode"], input.pincode-input');
      await pincodeInput.clear();
      await pincodeInput.fill(pincode);
      await page.press('input[placeholder="Enter your pincode"], input.pincode-input', 'Enter');
      
      // Click on confirm/submit button if available
      try {
        await page.waitForSelector('button[type="submit"], button.submit-button, button.btn-confirm', { timeout: 3000 });
        await page.click('button[type="submit"], button.submit-button, button.btn-confirm');
      } catch (buttonError) {
        console.log('No confirmation button found, continuing with Enter key press');
      }
      
      // Wait longer for pincode to be set and location to update
      await page.waitForTimeout(3000);
      
      // Verify pincode was set by checking for pincode display in the header
      try {
        const displayedPincode = await page.locator('.location-name, .delivery-address, [data-test-id="delivery-location-input"]').textContent();
        if (displayedPincode && displayedPincode.includes(pincode)) {
          console.log(`Successfully set pincode to ${pincode}`);
        } else {
          console.log(`Pincode might not be set correctly. Displayed: ${displayedPincode}`);
        }
      } catch (verifyError) {
        console.log('Could not verify pincode was set correctly');
      }
    } catch (error) {
      console.log('Could not set pincode, continuing anyway:', error);
    }
    
    // Normalize search query
    const normalizedQuery = query.toLowerCase().trim();
    console.log(`Normalized search query: "${normalizedQuery}"`);
    
    // Search for the product
    await page.waitForSelector('input[type="search"]', { timeout: 10000 });
    await page.fill('input[type="search"]', normalizedQuery);
    await page.press('input[type="search"]', 'Enter');
    
    // Wait for search results
    await page.waitForTimeout(5000);
    
    // Take screenshot for debugging
    await page.screenshot({ path: `blinkit-search-${normalizedQuery.replace(/\s+/g, '-')}.png` });
    
    // Check if we're on a product listing page or product detail page
    let productCount = 0;
    try {
      // First check if we have product cards using the new Tailwind CSS classes
      productCount = await page.locator('.tw-relative.tw-flex.tw-h-full.tw-flex-col, [role="button"][id][style*="border-radius: 8px"], [tabindex="0"][role="button"][id]').count();
      console.log(`Found ${productCount} products for "${normalizedQuery}"`);
      
      if (productCount === 0) {
        // Try alternative selectors that might be used in Blinkit
        const altCount = await page.locator('.product-card, .plp-product, [data-test-id="product-card"]').count();
        if (altCount > 0) {
          console.log(`Found ${altCount} products with alternative selector for "${normalizedQuery}"`);
          productCount = altCount;
        } else {
          throw new Error(`No products found for "${normalizedQuery}"`);
        }
      }
      
      // Get all products with new Tailwind CSS selectors
      const products = await page.locator('.tw-relative.tw-flex.tw-h-full.tw-flex-col, [role="button"][id][style*="border-radius: 8px"], [tabindex="0"][role="button"][id]').all();
      let selectedProduct = null;
      let bestMatchScore = 0;
      
      // Try to find the best match by looking at product titles with improved scoring
      for (const product of products) {
        // Try multiple possible selectors for product title with new Tailwind classes
        const title = await product.locator('.tw-text-300.tw-font-semibold.tw-line-clamp-2, .tw-font-semibold').textContent() || '';
        const titleLower = title.toLowerCase();
        console.log(`Candidate product: "${title}"`);
        
        // Calculate match score based on title relevance with improved heuristics
        let score = 0;
        
        // Exact match is best
        if (titleLower.includes(normalizedQuery)) {
          score += 100;
        }

        // Prioritize dairy-related terms when searching for milk
        if (normalizedQuery.includes('milk') && 
            (titleLower.includes('dairy') || 
             titleLower.includes('toned') || 
             titleLower.includes('full cream') || 
             titleLower.includes('skimmed') ||
             titleLower.includes('cow') ||
             titleLower.includes('buffalo'))) {
          score += 30;
        }
        
        // Check for query words in title
        const queryWords = normalizedQuery.split(/\s+/);
        for (const word of queryWords) {
          if (word.length > 2 && titleLower.includes(word)) {
            score += 10;
          }
        }
        
        // Strongly avoid wrong products - penalize more aggressively
        if (normalizedQuery.includes('milk') && 
            (titleLower.includes('onion') || 
             titleLower.includes('tomato') || 
             titleLower.includes('potato'))) {
          score -= 100; // Strong penalty for completely wrong product category
        }
        
        console.log(`Score for "${title}": ${score}`);
        
        // Update best match if this has a higher score
        if (score > bestMatchScore) {
          bestMatchScore = score;
          selectedProduct = product;
        }
      }
      
      // If no good match found, use first product but with more careful checking
      if (!selectedProduct || bestMatchScore < 10) {
        console.log(`No good match found with sufficient score, checking first few products more carefully`);
        
        // Check first 3 products more carefully (if available)
        for (let i = 0; i < Math.min(3, products.length); i++) {
          const product = products[i];
          const title = await product.locator('.tw-text-300.tw-font-semibold.tw-line-clamp-2, .tw-font-semibold').textContent() || '';
          const titleLower = title.toLowerCase();
          
          // For milk query, ensure we don't select a non-dairy item
          if (normalizedQuery.includes('milk') && 
              !(titleLower.includes('onion') || titleLower.includes('potato') || titleLower.includes('tomato'))) {
            console.log(`Selected safer option: "${title}"`);
            selectedProduct = product;
            break;
          }
        }
        
        // As a last resort, use first product
        if (!selectedProduct && products.length > 0) {
          console.log(`Using first product as last resort`);
          selectedProduct = products[0];
        }
      }
      
      if (!selectedProduct) {
        throw new Error(`Could not find a suitable product for "${normalizedQuery}"`);
      }
      
      // Extract product details from the selected product using new selectors
      const productTitle = await selectedProduct.locator('.tw-text-300.tw-font-semibold.tw-line-clamp-2, .tw-font-semibold').textContent() || `${query} (Blinkit)`;
      console.log(`Selected product: "${productTitle}"`);
      
      // Extract price - now using the new Tailwind price selectors
      let priceText = '';
      let price = 'Price not available';
      let originalPrice = '';
      try {
        // Try to get current price using new selectors
        priceText = await selectedProduct.locator('.tw-text-200.tw-font-semibold').first().textContent() || '';
        price = priceText.trim();
        
        // Try to get original/strikethrough price if available (for discounted products)
        const originalPriceElement = await selectedProduct.locator('.tw-text-200.tw-font-regular.tw-line-through').textContent();
        if (originalPriceElement) {
          originalPrice = originalPriceElement.replace(/[^\d₹.]/g, '').trim();
        }
        
        console.log(`Extracted price: ${price}, Original price: ${originalPrice || 'N/A'}`);
      } catch (priceError) {
        console.log('Failed to extract price:', priceError);
      }
      
      // Extract discount percentage if available
      let discount = '';
      try {
        const discountElement = await selectedProduct.locator('.tw-absolute.tw-z-20 .tw-font-extrabold, .tw-text-050.tw-absolute.tw-z-20').textContent();
        if (discountElement && discountElement.includes('%')) {
          discount = discountElement.trim();
          console.log(`Extracted discount: ${discount}`);
        }
      } catch (discountError) {
        console.log('No discount found or failed to extract discount');
      }
      
      // Extract quantity information using new Tailwind selectors
      let quantity = 'Not specified';
      try {
        // Try dedicated quantity element
        const quantityElement = await selectedProduct.locator('.tw-text-200.tw-font-medium.tw-line-clamp-1').textContent();
        if (quantityElement) {
          quantity = quantityElement.replace(/\s*<div.*$/, '').trim(); // Remove any additional div content
          console.log(`Found quantity in dedicated element: ${quantity}`);
        } else {
          // Look for quantity in product name with broader pattern matching
          const weightMatch = productTitle.match(/(\d+\s*[gGkKlLmM][gGlL]?\b|\d+\s*pieces|\d+\s*pack|\d+\s*ml|\d+\s*l|\d+\s*kg|\d+\s*gm)/i);
          if (weightMatch) {
            quantity = weightMatch[0].trim();
            console.log(`Extracted quantity from title: ${quantity}`);
          }
        }
        
        // If still no quantity and it's milk, assume a default size
        if ((quantity === 'Not specified') && normalizedQuery.includes('milk')) {
          quantity = '500 ml'; // Default milk size assumption
          console.log(`Using default quantity for milk: ${quantity}`);
        }
      } catch (quantityError) {
        console.log('Failed to extract quantity:', quantityError);
      }
      
      // Get high-resolution image URL with new selector structure
      let imageUrl = '';
      try {
        // Try to get image from the product card
        const imgElement = await selectedProduct.locator('img').first();
        if (imgElement) {
          imageUrl = await imgElement.getAttribute('src') || '';
          console.log(`Found image URL: ${imageUrl}`);
        }
        
        // Ensure we have a full URL
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `https://blinkit.com${imageUrl}`;
        }
      } catch (imageError) {
        console.log('Failed to extract image URL:', imageError);
      }
      
      // Check if product is available - looking for "ADD" button
      let available = true;
      try {
        // Check for ADD button which indicates product is available
        const addButton = await selectedProduct.locator('.tw-text-base-green:has-text("ADD"), .tw-border-base-green').count();
        available = addButton > 0;
        
        console.log(`Product availability: ${available ? 'In stock' : 'Out of stock'}`);
      } catch (availabilityError) {
        console.log('Failed to determine availability:', availabilityError);
      }
      
      // Get delivery time from the new element structure
      let deliveryEta = '';
      try {
        const etaText = await selectedProduct.locator('.tw-text-050.tw-font-bold.tw-uppercase').textContent();
        if (etaText) {
          deliveryEta = etaText.trim();
          console.log(`Delivery ETA: ${deliveryEta}`);
        } else {
          deliveryEta = '10 mins'; // Default value based on observed pattern
        }
      } catch (error) {
        console.log('Delivery time not found, using default value');
        deliveryEta = '10 mins';
      }
      
      return {
        platform: 'Blinkit',
        productTitle,
        price,
        quantity,
        available,
        deliveryEta,
        imageUrl,
        originalPrice,
        discount,
      };
    } catch (error) {
      console.error('Failed to extract product information:', error);
      
      // Return a fallback response
      return {
        platform: 'Blinkit',
        productTitle: `${query} (Blinkit)`,
        available: false,
        error: error instanceof Error ? error.message : 'Product not found',
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