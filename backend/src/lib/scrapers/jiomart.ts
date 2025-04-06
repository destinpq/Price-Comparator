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
    
    // Set delivery location using pincode with improved handling
    try {
      // Click on the pincode/location button with multiple possible selectors
      const locationButtonSelectors = [
        '.pincode_img', 
        '.delivery-location', 
        '.location-selector',
        '.address-selection',
        '[data-test="pincode-selector"]',
        // Possible Tailwind selectors
        '[class*="tw-location"]'
      ];
      
      let locationFound = false;
      for (const selector of locationButtonSelectors) {
        const hasLocationButton = await page.locator(selector).count() > 0;
        if (hasLocationButton) {
          await page.click(selector);
          locationFound = true;
          console.log(`Found location button with selector: ${selector}`);
          break;
        }
      }
      
      if (!locationFound) {
        console.log('Could not find location button, trying to continue');
      } else {
        // Enter pincode with multiple possible selectors
        const pincodeInputSelectors = [
          'input#rel_pincode', 
          'input[placeholder*="pincode"]', 
          'input[name="pincode"]',
          '.pincode-input',
          '#deliveryPinCode',
          // Possible Tailwind selectors
          'input[class*="tw-"]'
        ];
        
        let pincodeInput = false;
        for (const selector of pincodeInputSelectors) {
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
          // Submit pincode with multiple possible selectors
          const submitSelectors = [
            'button.apply_btn', 
            'button[type="submit"]', 
            '.submit-pincode',
            '.pin-submit',
            '.submit-btn',
            // Possible Tailwind selectors
            'button[class*="tw-"]'
          ];
          
          let submitFound = false;
          for (const selector of submitSelectors) {
            const hasSubmitButton = await page.locator(selector).count() > 0;
            if (hasSubmitButton) {
              await page.click(selector);
              submitFound = true;
              console.log(`Submitted pincode with selector: ${selector}`);
              break;
            }
          }
          
          if (!submitFound) {
            console.log('Could not find submit button, trying to press Enter');
            await page.keyboard.press('Enter');
          }
          
          // Wait for location to be applied
          await page.waitForTimeout(2000);
          
          // Verify pincode was set (if possible)
          try {
            const displayedPincode = await page.locator('.delivery-location-display, .selected-pincode, .user-pincode').textContent();
            if (displayedPincode && displayedPincode.includes(pincode)) {
              console.log(`Successfully set pincode to ${pincode}`);
            } else {
              console.log(`Possibly set pincode, displayed text: ${displayedPincode}`);
            }
          } catch (verifyError) {
            console.log('Could not verify pincode was set');
          }
        }
      }
    } catch (error) {
      console.log('Could not set pincode, continuing anyway:', error);
    }
    
    // Search for the product with improved selector handling
    try {
      // Try multiple search input selectors
      const searchInputSelectors = [
        'input#search', 
        '.search-input', 
        'input[placeholder*="Search"]',
        '.header-search input',
        '[data-test="search-box"]',
        // Possible Tailwind selectors
        'input[class*="tw-"]'
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
      await page.screenshot({ path: 'jiomart-search.png' });
      
      // Check if any products were found using multiple selectors
      const productSelectors = [
        '.product-item', 
        '.product-card', 
        '.sku-item', 
        '.product-box',
        '.product-container',
        // Possible Tailwind selectors
        '[class*="tw-relative"][class*="tw-flex"]',
        '[class*="tw-product"]'
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
        
        // Extract product details using multiple possible selectors
        // Try multiple title selectors including potential Tailwind classes
        const titleSelectors = [
          '.product-title', 
          '.name', 
          '.item-name', 
          'h2', 
          'h3',
          '.product-name',
          // Possible Tailwind selectors
          '[class*="tw-text-"][class*="tw-font-semibold"]',
          '[class*="tw-line-clamp"]'
        ];
        
        let productTitle = `${query} (JioMart)`;
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
          // Try multiple price selectors, including potential Tailwind
          const priceSelectors = [
            '.price', 
            '.discounted-price', 
            '.offer-price', 
            '.final-price',
            '[data-price]',
            // Possible Tailwind selectors
            '[class*="tw-text-"][class*="tw-font-semibold"]',
            '[class*="tw-price"]'
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
          
          // Try to find original price (strikethrough)
          const originalPriceSelectors = [
            '.mrp', 
            '.original-price', 
            '.strikethrough', 
            '.old-price',
            // Possible Tailwind selectors
            '[class*="tw-line-through"]'
          ];
          
          for (const selector of originalPriceSelectors) {
            const hasOriginalPrice = await firstProduct.locator(selector).count() > 0;
            if (hasOriginalPrice) {
              const originalPriceText = await firstProduct.locator(selector).textContent();
              if (originalPriceText) {
                originalPrice = originalPriceText.trim();
                console.log(`Found original price with selector: ${selector}`);
                break;
              }
            }
          }
          
          // Clean up price text (remove extra text)
          price = price.replace(/mrp|offer price|price/i, '').trim();
          originalPrice = originalPrice.replace(/mrp|original price|price/i, '').trim();
        } catch (priceError) {
          console.log('Failed to extract price:', priceError);
        }
        
        // Extract quantity information with multiple possible selectors
        let quantity = 'Not specified';
        try {
          // First try to find a dedicated quantity element
          const quantitySelectors = [
            '.product-weight', 
            '.weight', 
            '.package-size', 
            '.quantity',
            '.pack-size',
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
          
          // If still not found, look for quantity in the product title
          if (quantity === 'Not specified') {
            const weightMatch = productTitle.match(/(\d+\s*[gGkKlLmM][gGlL]?\b|\d+\s*pieces|\d+\s*pack|\d+\s*x\s*\d+|\d+\s*(ml|ltr|kg|gm))/i);
            if (weightMatch) {
              quantity = weightMatch[0].trim();
              console.log(`Extracted quantity from title: ${quantity}`);
            }
          }
        } catch (quantityError) {
          console.log('Failed to extract quantity:', quantityError);
        }
        
        // Get high-resolution image URL with improved handling
        let imageUrl = '';
        try {
          // Try multiple image selectors
          const imageSelectors = [
            'img.product-image', 
            'img.sku-image', 
            'img[data-src]', 
            'img.lazy',
            'img[class*="product"]',
            // Fallback to any image
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
            imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `https://www.jiomart.com${imageUrl}`;
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
            '.unavailable',
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
        
        // Get delivery estimate with multiple possible selectors
        let deliveryEta = 'Standard Delivery (1-3 days)';
        try {
          const deliverySelectors = [
            '.delivery-info', 
            '.delivery-time', 
            '.edd-info',
            '.shipping-info',
            // Possible Tailwind selectors
            '[class*="tw-text-"][class*="tw-delivery"]',
            '[class*="tw-font-bold"][class*="tw-text-"]'
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
            '.discount-tag',
            // Possible Tailwind selectors
            '[class*="tw-text-"][class*="tw-bg-"]',
            '[class*="tw-absolute"]'
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
          platform: 'JioMart',
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
        // Try alternative product container selector
        try {
          const altSelectors = [
            '.product', 
            '.item', 
            '[data-sku]',
            '.product-listing',
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
            
            // Extract basic product info
            let productTitle = `${query} (JioMart)`;
            let price = 'Price not available';
            let imageUrl = '';
            
            // Title with multiple selectors
            const titleSelectors = ['h2', 'h3', '.title', '.name', '[class*="tw-"]'];
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
            
            // Price with multiple selectors
            const priceSelectors = ['.price', '[data-price]', '[class*="tw-"]'];
            for (const selector of priceSelectors) {
              const hasPrice = await firstProduct.locator(selector).count() > 0;
              if (hasPrice) {
                const priceText = await firstProduct.locator(selector).textContent();
                if (priceText) {
                  price = priceText.trim();
                  break;
                }
              }
            }
            
            // Image with multiple selectors
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
                imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `https://www.jiomart.com${imageUrl}`;
              }
            } catch (imageError) {
              console.log('Failed to extract image URL:', imageError);
            }
            
            return {
              platform: 'JioMart',
              productTitle,
              price,
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