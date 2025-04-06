import { chromium } from 'playwright';
import { ScraperResult } from './index';

export async function scrapeDmart(item: string, pincode: string): Promise<ScraperResult> {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      viewport: { width: 1366, height: 768 }
    });
    const page = await context.newPage();
    
    // Navigate to D-Mart Ready
    await page.goto('https://www.dmartready.com/');
    
    // Set location (pincode)
    try {
      // Check if location needs to be set
      const locationSelector = await page.$('button:has-text("Select Area")') || 
                              await page.$('button:has-text("Change Area")');
      
      if (locationSelector) {
        await locationSelector.click();
        // Wait for the location modal
        await page.waitForSelector('input[placeholder*="Enter Pincode"]', { timeout: 5000 });
        await page.fill('input[placeholder*="Enter Pincode"]', pincode);
        await page.click('button:has-text("SUBMIT")');
        // Wait for location to be set
        await page.waitForNavigation({ timeout: 10000 });
      }
    } catch (_unused) {
      console.log('Location already set or selector not found');
    }
    
    // Search for the item
    await page.waitForSelector('input[placeholder*="Search"]');
    await page.fill('input[placeholder*="Search"]', item);
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Wait for search results
    await page.waitForSelector('.product-box', { timeout: 10000 }).catch(() => {
      throw new Error('No products found on D-Mart Ready');
    });
    
    // Get the first product
    const firstProduct = await page.$$('.product-box').then(elements => elements[0]);
    
    if (!firstProduct) {
      throw new Error('No products found on D-Mart Ready');
    }
    
    // Extract product details
    const productTitle = await firstProduct.$eval('.product-title', el => el.textContent?.trim() || 'Unknown Product');
    const price = await firstProduct.$eval('.product-price', el => el.textContent?.trim() || null);
    const outOfStockElement = await firstProduct.$('.out-of-stock, .sold-out');
    const available = !outOfStockElement;
    
    // Extract quantity information
    let quantity = 'Not specified';
    try {
      // First try to find dedicated quantity element
      const quantityElement = await firstProduct.$('.product-weight, .product-qty, .pack-size');
      if (quantityElement) {
        quantity = await quantityElement.textContent() || 'Not specified';
      } else {
        // Extract from product title if possible
        const weightMatch = productTitle.match(/(\d+\s*[gGkKlLmM][gGlL]?\b|\d+\s*pieces|\d+\s*pack|\d+\s*x\s*\d+|\d+\s*(ml|ltr|L))/i);
        if (weightMatch) {
          quantity = weightMatch[0].trim();
        }
      }
    } catch (quantityError) {
      console.log('Failed to extract quantity:', quantityError);
    }
    
    // Extract delivery ETA if available
    let deliveryEta = null;
    try {
      deliveryEta = await page.$eval('.delivery-info', el => el.textContent?.trim() || null);
    } catch (_unused) {
      // Delivery info not available
    }
    
    // Get image URL if available
    let imageUrl = null;
    try {
      imageUrl = await firstProduct.$eval('.product-image img', el => el.getAttribute('src') || null);
      
      // If image URL is lazy-loaded, try data attributes
      if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('lazy')) {
        imageUrl = await firstProduct.$eval('img', el => 
          el.getAttribute('data-src') || 
          el.getAttribute('data-lazy-src') || 
          el.getAttribute('data-original') || 
          el.getAttribute('src') || null
        );
      }
    } catch (_unused) {
      // Image not available
    }
    
    return {
      platform: 'D-Mart Ready',
      productTitle,
      price,
      quantity,
      available,
      deliveryEta,
      imageUrl
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