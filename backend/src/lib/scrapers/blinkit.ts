import { chromium } from 'playwright';
import { ScraperResult } from './index';

export async function scrapeBlinkit(item: string, pincode: string): Promise<ScraperResult> {
  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to Blinkit
    await page.goto('https://blinkit.com');
    
    // Set location (pincode)
    try {
      // Check if location needs to be set
      const locationButton = await page.$('button:has-text("Set Location")');
      if (locationButton) {
        await locationButton.click();
        // Wait for the location modal
        await page.waitForSelector('input[placeholder*="pincode"]', { timeout: 5000 });
        await page.fill('input[placeholder*="pincode"]', pincode);
        await page.click('button:has-text("Proceed")');
        // Wait for location to be set
        await page.waitForSelector('.header-location', { timeout: 10000 });
      }
    } catch (_) {
      console.log('Location already set or selector not found');
    }
    
    // Search for the item
    await page.waitForSelector('input[placeholder*="Search"]');
    await page.fill('input[placeholder*="Search"]', item);
    await page.press('input[placeholder*="Search"]', 'Enter');
    
    // Wait for search results
    await page.waitForSelector('.product-card', { timeout: 10000 }).catch(() => {
      throw new Error('No products found on Blinkit');
    });
    
    // Get the first product
    const firstProduct = await page.$$('.product-card').then(elements => elements[0]);
    
    if (!firstProduct) {
      throw new Error('No products found on Blinkit');
    }
    
    // Extract product details
    const productTitle = await firstProduct.$eval('.product-name', el => el.textContent?.trim() || 'Unknown Product');
    const price = await firstProduct.$eval('.product-price', el => el.textContent?.trim() || null);
    const available = !(await firstProduct.$('.out-of-stock'));
    
    // Extract delivery ETA if available
    let deliveryEta = null;
    try {
      deliveryEta = await firstProduct.$eval('.delivery-time', el => el.textContent?.trim() || null);
    } catch (_) {
      // Delivery info not available
    }
    
    // Get image URL if available
    let imageUrl = null;
    try {
      imageUrl = await firstProduct.$eval('img', el => el.getAttribute('src') || null);
    } catch (_) {
      // Image not available
    }
    
    return {
      platform: 'Blinkit',
      productTitle,
      price,
      available,
      deliveryEta,
      imageUrl
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Blinkit scraping error: ${error.message}`);
    }
    throw new Error('Unknown error occurred while scraping Blinkit');
  } finally {
    await browser.close();
  }
} 