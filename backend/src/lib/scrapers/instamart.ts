import { chromium } from 'playwright';
import { ScrapedResult } from './blinkit';

export async function scrapeInstamart(item: string, pincode: string): Promise<ScrapedResult> {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      viewport: { width: 1366, height: 768 }
    });
    const page = await context.newPage();
    
    // Navigate to Swiggy Instamart
    await page.goto('https://instamart.swiggy.com/');
    
    // Set location (pincode) with improved handling
    try {
      // Check if location needs to be set with multiple possible selectors
      const locationButtonSelectors = [
        'button:has-text("Set Location")',
        'button:has-text("Change Location")',
        '.location-btn',
        '.address-selection',
        // Potential Tailwind selectors
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
        // Try multiple pincode input selectors
        const pincodeInputSelectors = [
          'input[placeholder*="pincode"]',
          'input[name="pincode"]',
          '.pincode-input',
          '.address-input',
          // Potential Tailwind selectors
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
          // Try multiple confirm location button selectors
          const confirmSelectors = [
            'button:has-text("Confirm Location")',
            'button:has-text("Continue")',
            'button[type="submit"]',
            '.submit-btn',
            // Potential Tailwind selectors
            'button[class*="tw-"]'
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
            console.log('Could not find confirm button, trying to press Enter');
            await page.keyboard.press('Enter');
          }
          
          // Wait for location to be set
          await page.waitForTimeout(3000);
          
          // Verify location was set if possible
          try {
            const displayedLocation = await page.locator('.location-display, .address-info, .current-location').textContent();
            console.log(`Location display shows: ${displayedLocation}`);
          } catch (verifyError) {
            console.log('Could not verify location was set');
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
      // Potential Tailwind selectors
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
      '.product-card',
      '.product-item',
      '.item-card',
      '.product-container',
      // Potential Tailwind selectors
      '[class*="tw-product"]',
      '[class*="tw-relative"][class*="tw-flex"]'
    ];
    
    // Wait for products to appear
    await page.waitForTimeout(5000);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'instamart-search.png' });
    
    let productFound = false;
    let productSelector = '';
    
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
      throw new Error('No products found on Swiggy Instamart');
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
      '.item-name',
      // Potential Tailwind selectors
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
      '.amount',
      // Potential Tailwind selectors
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
      // Potential Tailwind selectors
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
      // Try multiple quantity selectors
      const quantitySelectors = [
        '.product-weight',
        '.package-size',
        '.quantity-info',
        '.weight',
        '.size',
        '.pack-size',
        // Potential Tailwind selectors
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
      
      // If still not found, extract from product title
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
        '.delivery-time',
        '.eta',
        '.shipping-info',
        '.delivery-info',
        // Potential Tailwind selectors
        '[class*="tw-text-"][class*="tw-delivery"]',
        '[class*="tw-font-bold"][class*="tw-text-"]'
      ];
      
      for (const selector of deliverySelectors) {
        const hasDelivery = await page.locator(selector).count() > 0;
        if (hasDelivery) {
          const deliveryText = await page.locator(selector).textContent();
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
            
            // Ensure we have a full URL
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `https://instamart.swiggy.com${imageUrl}`;
            }
            
            break;
          }
        }
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
        '.list-price',
        // Potential Tailwind selectors
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
        '.discount-tag',
        // Potential Tailwind selectors
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
      platform: 'Swiggy Instamart',
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
      throw new Error(`Instamart scraping error: ${error.message}`);
    }
    throw new Error('Unknown error occurred while scraping Instamart');
  } finally {
    await browser.close();
  }
} 