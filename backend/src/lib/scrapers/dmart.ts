import { chromium } from 'playwright';
import { ScraperResult } from './index';

export async function scrapeDmart(item: string, pincode: string): Promise<ScraperResult> {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext();
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
    } catch (_) {
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
    
    // Extract delivery ETA if available
    let deliveryEta = null;
    try {
      deliveryEta = await page.$eval('.delivery-info', el => el.textContent?.trim() || null);
    } catch (_) {
      // Delivery info not available
    }
    
    // Get image URL if available
    let imageUrl = null;
    try {
      imageUrl = await firstProduct.$eval('.product-image img', el => el.getAttribute('src') || null);
    } catch (_) {
      // Image not available
    }
    
    return {
      platform: 'D-Mart Ready',
      productTitle,
      price,
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