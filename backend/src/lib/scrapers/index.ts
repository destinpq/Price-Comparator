import { scrapeBlinkit, ScrapedResult as BlinkitResult } from './blinkit';
import { scrapeZepto } from './zepto';
import { scrapeDmart } from './dmart';
import { scrapeInstamart } from './instamart';
import { scrapeBigBasket } from './bigbasket';
import { scrapeJioMart } from './jiomart';

export interface ScraperResult {
  platform: string;
  productTitle: string;
  price: string | null;
  quantity: string | null;
  available: boolean;
  deliveryEta: string | null;
  imageUrl?: string | null;
  error?: string;
  originalPrice?: string | null;
  discount?: string | null;
}

// Export type for other modules
export type { BlinkitResult as ScrapedResult };

export async function scrapeAllPlatforms(item: string, pincode: string): Promise<{
  results: ScraperResult[];
  timestamp: string;
}> {
  // Run scrapers in parallel
  const [blinkitResult, zeptoResult, dmartResult, instamartResult, bigBasketResult, jioMartResult] = await Promise.allSettled([
    scrapeBlinkit(item, pincode),
    scrapeZepto(item, pincode),
    scrapeDmart(item, pincode),
    scrapeInstamart(item, pincode),
    scrapeBigBasket(item, pincode),
    scrapeJioMart(item, pincode)
  ]);
  
  const results: ScraperResult[] = [];
  
  // Process results
  if (blinkitResult.status === 'fulfilled') {
    const result = blinkitResult.value;
    results.push({
      platform: result.platform,
      productTitle: result.productTitle || item,
      price: result.price || null,
      quantity: result.quantity || null,
      available: result.available,
      deliveryEta: result.deliveryEta || null,
      imageUrl: result.imageUrl || null,
      error: result.error,
      originalPrice: result.originalPrice || null,
      discount: result.discount || null
    });
  } else {
    results.push({
      platform: 'Blinkit',
      productTitle: item,
      price: null,
      quantity: null,
      available: false,
      deliveryEta: null,
      error: blinkitResult.reason?.message || 'Failed to scrape'
    });
  }
  
  if (zeptoResult.status === 'fulfilled') {
    const result = zeptoResult.value;
    results.push({
      platform: result.platform,
      productTitle: result.productTitle || item,
      price: result.price || null,
      quantity: result.quantity || null,
      available: result.available,
      deliveryEta: result.deliveryEta || null,
      imageUrl: result.imageUrl || null,
      error: result.error,
      originalPrice: result.originalPrice || null,
      discount: result.discount || null
    });
  } else {
    results.push({
      platform: 'Zepto',
      productTitle: item,
      price: null,
      quantity: null,
      available: false,
      deliveryEta: null,
      error: zeptoResult.reason?.message || 'Failed to scrape'
    });
  }
  
  if (dmartResult.status === 'fulfilled') {
    const result = dmartResult.value;
    results.push({
      platform: result.platform,
      productTitle: result.productTitle || item,
      price: result.price || null,
      quantity: result.quantity || null,
      available: result.available,
      deliveryEta: result.deliveryEta || null,
      imageUrl: result.imageUrl || null,
      error: result.error,
      originalPrice: result.originalPrice || null,
      discount: result.discount || null
    });
  } else {
    results.push({
      platform: 'D-Mart',
      productTitle: item,
      price: null,
      quantity: null,
      available: false,
      deliveryEta: null,
      error: dmartResult.reason?.message || 'Failed to scrape'
    });
  }
  
  if (instamartResult.status === 'fulfilled') {
    const result = instamartResult.value;
    results.push({
      platform: result.platform,
      productTitle: result.productTitle || item,
      price: result.price || null,
      quantity: result.quantity || null,
      available: result.available,
      deliveryEta: result.deliveryEta || null,
      imageUrl: result.imageUrl || null,
      error: result.error,
      originalPrice: result.originalPrice || null,
      discount: result.discount || null
    });
  } else {
    results.push({
      platform: 'Instamart',
      productTitle: item,
      price: null,
      quantity: null,
      available: false,
      deliveryEta: null,
      error: instamartResult.reason?.message || 'Failed to scrape'
    });
  }
  
  // Process BigBasket result
  if (bigBasketResult.status === 'fulfilled') {
    const result = bigBasketResult.value;
    results.push({
      platform: result.platform,
      productTitle: result.productTitle || item,
      price: result.price || null,
      quantity: result.quantity || null,
      available: result.available,
      deliveryEta: result.deliveryEta || null,
      imageUrl: result.imageUrl || null,
      error: result.error,
      originalPrice: result.originalPrice || null,
      discount: result.discount || null
    });
  } else {
    results.push({
      platform: 'BigBasket',
      productTitle: item,
      price: null,
      quantity: null,
      available: false,
      deliveryEta: null,
      error: bigBasketResult.reason?.message || 'Failed to scrape'
    });
  }
  
  // Process JioMart result
  if (jioMartResult.status === 'fulfilled') {
    const result = jioMartResult.value;
    results.push({
      platform: result.platform,
      productTitle: result.productTitle || item,
      price: result.price || null,
      quantity: result.quantity || null,
      available: result.available,
      deliveryEta: result.deliveryEta || null,
      imageUrl: result.imageUrl || null,
      error: result.error,
      originalPrice: result.originalPrice || null,
      discount: result.discount || null
    });
  } else {
    results.push({
      platform: 'JioMart',
      productTitle: item,
      price: null,
      quantity: null,
      available: false,
      deliveryEta: null,
      error: jioMartResult.reason?.message || 'Failed to scrape'
    });
  }
  
  return {
    results,
    timestamp: new Date().toISOString()
  };
}

export {
  scrapeBlinkit,
  scrapeZepto,
  scrapeBigBasket,
  scrapeJioMart
}; 