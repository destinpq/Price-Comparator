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
    
    // Set pincode/location with improved handling
    try {
      // Look for location picker with multiple possible selectors
      const locationSelectors = [
        '.delivery-pin', 
        '[data-qa="locationSelector"]', 
        '#divaddress',
        '.location-chooser',
        '.pincode-selection',
        // Possible Tailwind selectors if they add them
        '[class*="tw-location"]'
      ];
      
      let locationFound = false;
      for (const selector of locationSelectors) {
        const hasLocationPicker = await page.locator(selector).count() > 0;
        if (hasLocationPicker) {
          await page.click(selector);
          locationFound = true;
          console.log(`Found location picker with selector: ${selector}`);
          break;
        }
      }
      
      if (!locationFound) {
        console.log('Could not find location picker, trying to continue anyway');
      } else {
        // Fill in the pincode with multiple possible selectors
        const pincodeSelectors = [
          'input#areaselect', 
          'input[placeholder*="pincode"]', 
          'input[name="pincode"]', 
          'input[placeholder*="Delivery"]',
          '.pincode-input'
        ];
        
        let pincodeInput = false;
        for (const selector of pincodeSelectors) {
          const hasPincodeInput = await page.locator(selector).count() > 0;
          if (hasPincodeInput) {
            await page.fill(selector, pincode);
            pincodeInput = true;
            console.log(`Filled pincode with selector: ${selector}`);
            break;
          }
        }
        
        if (!pincodeInput) {
          console.log('Could not find pincode input field');
        } else {
          await page.waitForTimeout(1000);
          
          // Select the first suggestion if available
          try {
            const suggestionSelectors = [
              '.ui-menu-item', 
              '.suggestions div', 
              '.area-suggestions',
              '.location-suggestion',
              '.dropdown-item'
            ];
            
            let suggestionFound = false;
            for (const selector of suggestionSelectors) {
              const hasSuggestions = await page.locator(selector).count() > 0;
              if (hasSuggestions) {
                await page.click(selector);
                suggestionFound = true;
                console.log(`Selected suggestion with selector: ${selector}`);
                break;
              }
            }
            
            if (!suggestionFound) {
              console.log('No suggestions found, continuing without selecting');
            }
          } catch (suggestionError) {
            console.log('Error selecting suggestion:', suggestionError);
          }
          
          // Confirm location with multiple possible selectors
          const confirmSelectors = [
            'button.btn-submit', 
            '[type="submit"]', 
            '.confirm-location',
            '.submit-button',
            // Possible Tailwind selectors
            '[class*="tw-btn"]'
          ];
          
          let confirmFound = false;
          for (const selector of confirmSelectors) {
            const hasConfirmButton = await page.locator(selector).count() > 0;
            if (hasConfirmButton) {
              await page.click(selector);
              confirmFound = true;
              console.log(`Confirmed location with selector: ${selector}`);
              break;
            }
          }
          
          if (!confirmFound) {
            console.log('Could not find confirm button');
          }
          
          // Wait for location to be applied
          await page.waitForTimeout(2000);
        }
      }
    } catch (error) {
      console.log('Could not set location, continuing anyway:', error);
    }
    
    // Search for the product with improved selectors
    try {
      // Try multiple search input selectors
      const searchInputSelectors = [
        '#input', 
        '.search-input', 
        'input[placeholder*="Search"]',
        '.navbar-search input',
        '[data-qa="searchBar"]',
        // Possible Tailwind selectors
        '[class*="tw-search"]'
      ];
      
      let searchFound = false;
      for (const selector of searchInputSelectors) {
        const hasSearchInput = await page.locator(selector).count() > 0;
        if (hasSearchInput) {
          await page.fill(selector, query);
          await page.press(selector, 'Enter');
          searchFound = true;
          console.log(`Used search input selector: ${selector}`);
          break;
        }
      }
      
      if (!searchFound) {
        throw new Error('Could not find search input');
      }
      
      // Wait for search results
      await page.waitForTimeout(5000);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'bigbasket-search.png' });
      
      // Check if any products were found with multiple possible selectors
      const productSelectors = [
        '.product-item', 
        '.prod-deck', 
        '.product-card', 
        'li.item',
        '.product-container',
        // Possible Tailwind selectors
        '[class*="tw-product"]',
        '[class*="tw-relative"][class*="tw-flex"]'
      ];
      
      let productExists = false;
      let productSelector = '';
      
      for (const selector of productSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          productExists = true;
          productSelector = selector;
          console.log(`Found ${count} products with selector: ${selector}`);
          break;
        }
      }
      
      if (productExists) {
        // Get the first product
        const firstProduct = await page.locator(productSelector).first();
        
        // Extract product details with multiple possible selectors
        // Try multiple title selectors including potential Tailwind classes
        const titleSelectors = [
          '.prod-name', 
          '.product-name', 
          'h3', 
          '.item-name',
          // Possible Tailwind selectors
          '[class*="tw-text-"][class*="tw-font-semibold"]',
          '[class*="tw-line-clamp"]'
        ];
        
        let productTitle = `${query} (BigBasket)`;
        for (const selector of titleSelectors) {
          const hasTitle = await firstProduct.locator(selector).count() > 0;
          if (hasTitle) {
            const titleText = await firstProduct.locator(selector).textContent();
            if (titleText) {
              productTitle = titleText.trim();
              console.log(`Found product title with selector: ${selector}`);
              break;
            }
          }
        }
        
        // Extract price with better handling
        let price = 'Price not available';
        let originalPrice = '';
        try {
          // Try multiple selectors for price with prioritized order
          const priceSelectors = [
            '.discounted-price', 
            '.sale-price', 
            '.SP', 
            '[data-qa="productPrice"]',
            '.price', 
            '.amount', 
            '.prod-price',
            // Possible Tailwind selectors
            '[class*="tw-text-"][class*="tw-font-semibold"]'
          ];
          
          for (const selector of priceSelectors) {
            const hasPrice = await firstProduct.locator(selector).count() > 0;
            if (hasPrice) {
              const priceText = await firstProduct.locator(selector).textContent();
              if (priceText) {
                price = priceText.trim();
                console.log(`Found price with selector: ${selector}`);
                break;
              }
            }
          }
          
          // Try to get original/strikethrough price
          const originalPriceSelectors = [
            '.strikethrough', 
            '.MRP', 
            '.original-price',
            '.mrp',
            // Possible Tailwind selectors
            '[class*="tw-line-through"]'
          ];
          
          for (const selector of originalPriceSelectors) {
            const hasOriginalPrice = await firstProduct.locator(selector).count() > 0;
            if (hasOriginalPrice) {
              const originalPriceText = await firstProduct.locator(selector).textContent();
              if (originalPriceText) {
                originalPrice = originalPriceText.replace(/MRP:?|Rs\.?/gi, '').trim();
                console.log(`Found original price with selector: ${selector}`);
                break;
              }
            }
          }
          
          // Clean up price text (remove currency symbol, commas, etc.)
          price = price.replace(/MRP:?|Price:?|\(.*\)|Rs\.?/gi, '').trim();
        } catch (priceError) {
          console.log('Failed to extract price:', priceError);
        }
        
        // Extract quantity information with multiple approaches
        let quantity = 'Not specified';
        try {
          // First try dedicated quantity/weight elements
          const quantitySelectors = [
            '.product-qty', 
            '.package-size', 
            '.weight', 
            '.pkg',
            '.product-size',
            // Possible Tailwind selectors
            '[class*="tw-text-"][class*="tw-font-medium"]'
          ];
          
          for (const selector of quantitySelectors) {
            const hasQuantity = await firstProduct.locator(selector).count() > 0;
            if (hasQuantity) {
              const quantityText = await firstProduct.locator(selector).textContent();
              if (quantityText) {
                quantity = quantityText.trim();
                console.log(`Found quantity with selector: ${selector}`);
                break;
              }
            }
          }
          
          // If still no quantity, look for it in the product title
          if (quantity === 'Not specified') {
            const weightMatch = productTitle.match(/(\d+\s*[gGkKlLmM][gGlL]?\b|\d+\s*pieces|\d+\s*pack|\d+\s*x\s*\d+|\d+\s*(ml|ltr|L|kg|gm))/i);
            if (weightMatch) {
              quantity = weightMatch[0].trim();
              console.log(`Extracted quantity from title: ${quantity}`);
            }
          }
        } catch (quantityError) {
          console.log('Failed to extract quantity:', quantityError);
        }
        
        // Get high-resolution image URL
        let imageUrl = '';
        try {
          // Try multiple image selectors
          const imageSelectors = [
            'img.product-img', 
            'img.item-img', 
            'img.product-image', 
            'img.lazy',
            'img[data-src]',
            // Any image inside the product
            'img'
          ];
          
          for (const selector of imageSelectors) {
            const hasImage = await firstProduct.locator(selector).count() > 0;
            if (hasImage) {
              // First try src attribute
              imageUrl = await firstProduct.locator(selector).getAttribute('src') || '';
              
              // If image is lazy-loaded or placeholder, try data attributes
              if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('lazy') || imageUrl.includes('default')) {
                // Try multiple data attributes
                for (const attr of ['data-src', 'data-lazy', 'data-original', 'data-lazy-src']) {
                  const attrValue = await firstProduct.locator(selector).getAttribute(attr);
                  if (attrValue) {
                    imageUrl = attrValue;
                    break;
                  }
                }
              }
              
              if (imageUrl) {
                console.log(`Found image with selector: ${selector}`);
                break;
              }
            }
          }
          
          // Ensure we have a full URL
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `https://www.bigbasket.com${imageUrl}`;
          }
        } catch (imageError) {
          console.log('Failed to extract image URL:', imageError);
        }
        
        // Check availability with multiple selectors
        let available = true;
        try {
          const unavailableSelectors = [
            '.out-of-stock', 
            '.sold-out', 
            '.not-available', 
            '.out_of_stock',
            // Possible Tailwind selectors
            '[class*="tw-text-red"]'
          ];
          
          for (const selector of unavailableSelectors) {
            const isUnavailable = await firstProduct.locator(selector).count() > 0;
            if (isUnavailable) {
              available = false;
              console.log(`Product unavailable according to selector: ${selector}`);
              break;
            }
          }
        } catch (availabilityError) {
          console.log('Failed to determine availability:', availabilityError);
        }
        
        // Get delivery estimate
        let deliveryEta = 'Same day delivery';
        try {
          const deliverySelectors = [
            '.delivery-info', 
            '.delivery-time', 
            '.eta',
            '.shipping-info',
            // Possible Tailwind selectors
            '[class*="tw-text-"][class*="tw-font-bold"]'
          ];
          
          for (const selector of deliverySelectors) {
            const hasDelivery = await firstProduct.locator(selector).count() > 0;
            if (hasDelivery) {
              const deliveryText = await firstProduct.locator(selector).textContent();
              if (deliveryText) {
                deliveryEta = deliveryText.trim();
                console.log(`Found delivery time with selector: ${selector}`);
                break;
              }
            }
          }
        } catch (etaError) {
          console.log('Delivery time not found, using default value');
        }
        
        // Look for discount percentage
        let discount = '';
        try {
          const discountSelectors = [
            '.discount', 
            '.off', 
            '.saving',
            '.offer-box',
            // Possible Tailwind selectors
            '[class*="tw-text-green"], [class*="tw-absolute"]'
          ];
          
          for (const selector of discountSelectors) {
            const hasDiscount = await firstProduct.locator(selector).count() > 0;
            if (hasDiscount) {
              const discountText = await firstProduct.locator(selector).textContent();
              if (discountText && discountText.includes('%')) {
                discount = discountText.trim();
                console.log(`Found discount with selector: ${selector}`);
                break;
              }
            }
          }
        } catch (discountError) {
          console.log('Failed to extract discount:', discountError);
        }
        
        return {
          platform: 'BigBasket',
          productTitle,
          price,
          quantity,
          available,
          deliveryEta,
          imageUrl,
          originalPrice,
          discount
        };
      } else {
        // Try alternative product container selectors
        try {
          const altSelectors = [
            '[data-qa="product"]', 
            '.prod-card', 
            '.product', 
            '.item',
            // Possible Tailwind selectors
            '[class*="tw-card"]'
          ];
          
          let altProductFound = false;
          let altProductSelector = '';
          
          for (const selector of altSelectors) {
            const count = await page.locator(selector).count();
            if (count > 0) {
              altProductFound = true;
              altProductSelector = selector;
              console.log(`Found ${count} products with alternative selector: ${selector}`);
              break;
            }
          }
          
          if (altProductFound) {
            const firstProduct = await page.locator(altProductSelector).first();
            
            // Extract basic product info with flexible selectors
            const titleSelectors = ['h3', 'h2', '.name', '.title', '[class*="tw-font-semibold"]'];
            let productTitle = `${query} (BigBasket)`;
            
            for (const selector of titleSelectors) {
              const hasTitle = await firstProduct.locator(selector).count() > 0;
              if (hasTitle) {
                const titleText = await firstProduct.locator(selector).textContent();
                if (titleText) {
                  productTitle = titleText.trim();
                  break;
                }
              }
            }
            
            // Get price with flexible selectors
            const priceSelectors = ['[data-qa="productPrice"]', '.price', '.amount', '[class*="tw-text-"]'];
            let price = 'Price not available';
            
            for (const selector of priceSelectors) {
              const hasPrice = await firstProduct.locator(selector).count() > 0;
              if (hasPrice) {
                const priceText = await firstProduct.locator(selector).textContent();
                if (priceText) {
                  price = priceText.trim().replace(/MRP:?|Price:?|Rs\.?/gi, '').trim();
                  break;
                }
              }
            }
            
            // Get image with fallback
            let imageUrl = '';
            try {
              imageUrl = await firstProduct.locator('img').getAttribute('src') || '';
              
              // Try data attributes if needed
              if (!imageUrl || imageUrl.includes('placeholder')) {
                for (const attr of ['data-src', 'data-lazy', 'data-original']) {
                  const attrValue = await firstProduct.locator('img').getAttribute(attr);
                  if (attrValue) {
                    imageUrl = attrValue;
                    break;
                  }
                }
              }
              
              // Ensure full URL
              if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `https://www.bigbasket.com${imageUrl}`;
              }
            } catch (imageError) {
              console.log('Failed to extract image URL:', imageError);
            }
            
            return {
              platform: 'BigBasket',
              productTitle,
              price,
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