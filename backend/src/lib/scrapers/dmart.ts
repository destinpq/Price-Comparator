import { chromium } from 'playwright';
import { ScrapedResult } from './blinkit';

export async function scrapeDmart(item: string, pincode: string): Promise<ScrapedResult> {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      viewport: { width: 1366, height: 768 }
    });
    const page = await context.newPage();
    
    // Navigate to D-Mart Ready
    await page.goto('https://www.dmartready.com/');
    
    // Set location (pincode) with improved handling
    try {
      // Check if location needs to be set with multiple possible selectors
      const locationButtonSelectors = [
        'button:has-text("Select Area")', 
        'button:has-text("Change Area")',
        '.location-btn',
        '.location-selector',
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
      
      if (locationFound) {
        // Wait for location modal with multiple possible selectors
        const pincodeInputSelectors = [
          'input[placeholder*="Enter Pincode"]',
          'input[placeholder*="pincode"]',
          'input[name="pincode"]',
          '.pincode-input',
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
        
        if (pincodeInput) {
          // Click submit button with multiple possible selectors
          const submitSelectors = [
            'button:has-text("SUBMIT")',
            'button:has-text("Submit")',
            'button[type="submit"]',
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
          
          // Wait for location to be set
          try {
            await page.waitForNavigation({ timeout: 10000 });
          } catch (navError) {
            console.log('Navigation timeout, continuing anyway');
          }
          
          // Verify pincode was set (if possible)
          try {
            const displayedPincode = await page.locator('.delivery-location, .current-location, .address-info').textContent();
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
    } catch (_unused) {
      console.log('Location already set or selector not found');
    }
    
    // Search for the item with improved selector handling
    const searchInputSelectors = [
      'input[placeholder*="Search"]',
      '.search-input',
      'input[type="search"]',
      // Possible Tailwind selectors
      'input[class*="tw-"]'
    ];
    
    let searchFound = false;
    for (const selector of searchInputSelectors) {
      const hasSearchInput = await page.locator(selector).count() > 0;
      if (hasSearchInput) {
        await page.fill(selector, item);
        await page.press(selector, 'Enter');
        searchFound = true;
        console.log(`Used search input selector: ${selector}`);
        break;
      }
    }
    
    if (!searchFound) {
      throw new Error('Could not find search input');
    }
    
    // Wait for search results with multiple possible selectors
    const productSelectors = [
      '.product-box',
      '.product-item',
      '.product-card',
      '.product-container',
      // Possible Tailwind selectors
      '[class*="tw-product"]',
      '[class*="tw-relative"][class*="tw-flex"]'
    ];
    
    let productFound = false;
    let productSelector = '';
    
    // Wait for products to appear
    await page.waitForTimeout(5000);
    
    for (const selector of productSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        productFound = true;
        productSelector = selector;
        console.log(`Found ${count} products with selector: ${selector}`);
        break;
      }
    }
    
    if (!productFound) {
      throw new Error('No products found on D-Mart Ready');
    }
    
    // Get the first product
    const firstProduct = await page.locator(productSelector).first();
    
    // Extract product details with improved selector handling
    // Get product title with multiple possible selectors
    const titleSelectors = [
      '.product-title',
      '.product-name',
      'h3',
      'h2',
      '.name',
      // Possible Tailwind selectors
      '[class*="tw-text-"][class*="tw-font-semibold"]',
      '[class*="tw-line-clamp"]'
    ];
    
    let productTitle = 'Unknown Product';
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
    
    // Get price with multiple possible selectors
    const priceSelectors = [
      '.product-price',
      '.price',
      '.offer-price',
      '.final-price',
      // Possible Tailwind selectors
      '[class*="tw-text-"][class*="tw-font-semibold"]',
      '[class*="tw-price"]'
    ];
    
    let price = null;
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
    
    // Check if out of stock with multiple possible selectors
    const outOfStockSelectors = [
      '.out-of-stock',
      '.sold-out',
      '.unavailable',
      // Possible Tailwind selectors
      '[class*="tw-text-red"]'
    ];
    
    let outOfStock = false;
    for (const selector of outOfStockSelectors) {
      const isOutOfStock = await firstProduct.locator(selector).count() > 0;
      if (isOutOfStock) {
        outOfStock = true;
        console.log(`Product unavailable according to selector: ${selector}`);
        break;
      }
    }
    
    // Extract quantity information with improved handling
    let quantity = 'Not specified';
    try {
      // First try to find dedicated quantity element
      const quantitySelectors = [
        '.product-weight',
        '.product-qty',
        '.pack-size',
        '.weight',
        '.quantity',
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
      
      // Extract from product title if not found yet
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
    
    // Extract delivery ETA if available
    let deliveryEta = null;
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
    } catch (_unused) {
      // Delivery info not available
    }
    
    // Get image URL with improved handling
    let imageUrl = null;
    try {
      const imageSelectors = [
        '.product-image img',
        '.product-img img',
        'img[src*="product"]',
        // Fallback to any image
        'img'
      ];
      
      for (const selector of imageSelectors) {
        const hasImage = await firstProduct.locator(selector).count() > 0;
        if (hasImage) {
          // Try src attribute first
          imageUrl = await firstProduct.locator(selector).getAttribute('src');
          
          // If image is lazy-loaded or placeholder, try data attributes
          if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('lazy')) {
            // Try multiple data attributes
            for (const attr of ['data-src', 'data-lazy-src', 'data-original', 'data-lazy']) {
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
      
      // Ensure full URL
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `https://www.dmartready.com${imageUrl}`;
      }
    } catch (_unused) {
      // Image not available
    }
    
    // Look for original price and discount
    let originalPrice = null;
    let discount = null;
    
    try {
      // Check for original price (usually shows as strikethrough)
      const originalPriceSelectors = [
        '.mrp',
        '.original-price',
        '.old-price',
        '.strikethrough',
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
      
      // Check for discount percentage
      const discountSelectors = [
        '.discount',
        '.offer',
        '.savings',
        '.off',
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
    } catch (priceError) {
      console.log('Failed to extract original price or discount:', priceError);
    }
    
    return {
      platform: 'D-Mart Ready',
      productTitle,
      price: price || undefined,
      quantity: quantity || undefined,
      available: !outOfStock,
      deliveryEta: deliveryEta || undefined,
      imageUrl: imageUrl || undefined,
      originalPrice: originalPrice || undefined,
      discount: discount || undefined
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`D-Mart scraping error: ${error.message}`);
    }
    throw new Error('Unknown error occurred while scraping D-Mart');
  } finally {
    await browser.close();
  }
} 