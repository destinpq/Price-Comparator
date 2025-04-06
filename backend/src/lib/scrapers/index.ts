import { scrapeBlinkit } from './blinkit';
import { scrapeZepto } from './zepto';
import { scrapeDmart } from './dmart';
import { scrapeInstamart } from './instamart';

export interface ScraperResult {
  platform: string;
  productTitle: string;
  price: string | null;
  available: boolean;
  deliveryEta: string | null;
  imageUrl?: string | null;
  error?: string;
}

export async function scrapeAllPlatforms(item: string, pincode: string): Promise<{
  results: ScraperResult[];
  timestamp: string;
}> {
  // Run scrapers in parallel
  const [blinkitResult, zeptoResult, dmartResult, instamartResult] = await Promise.allSettled([
    scrapeBlinkit(item, pincode),
    scrapeZepto(item, pincode),
    scrapeDmart(item, pincode),
    scrapeInstamart(item, pincode)
  ]);
  
  const results: ScraperResult[] = [];
  
  // Process results
  if (blinkitResult.status === 'fulfilled') {
    results.push(blinkitResult.value);
  } else {
    results.push({
      platform: 'Blinkit',
      productTitle: item,
      price: null,
      available: false,
      deliveryEta: null,
      error: blinkitResult.reason?.message || 'Failed to scrape'
    });
  }
  
  if (zeptoResult.status === 'fulfilled') {
    results.push(zeptoResult.value);
  } else {
    results.push({
      platform: 'Zepto',
      productTitle: item,
      price: null,
      available: false,
      deliveryEta: null,
      error: zeptoResult.reason?.message || 'Failed to scrape'
    });
  }
  
  if (dmartResult.status === 'fulfilled') {
    results.push(dmartResult.value);
  } else {
    results.push({
      platform: 'D-Mart',
      productTitle: item,
      price: null,
      available: false,
      deliveryEta: null,
      error: dmartResult.reason?.message || 'Failed to scrape'
    });
  }
  
  if (instamartResult.status === 'fulfilled') {
    results.push(instamartResult.value);
  } else {
    results.push({
      platform: 'Instamart',
      productTitle: item,
      price: null,
      available: false,
      deliveryEta: null,
      error: instamartResult.reason?.message || 'Failed to scrape'
    });
  }
  
  return {
    results,
    timestamp: new Date().toISOString()
  };
} 