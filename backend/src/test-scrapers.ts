import { scrapeBlinkit } from './lib/scrapers/blinkit';
import { scrapeZepto } from './lib/scrapers/zepto';
import { scrapeBigBasket } from './lib/scrapers/bigbasket';
import { scrapeJioMart } from './lib/scrapers/jiomart';

// Test product to search for
const TEST_PRODUCT = 'milk';
const TEST_PINCODE = '500034'; // Mumbai pincode for testing

async function testScraper(name: string, scraperFn: (product: string, pincode: string) => Promise<any>) {
  console.log(`\n--------- Testing ${name} Scraper ---------`);
  try {
    console.log(`Searching for "${TEST_PRODUCT}" in ${TEST_PINCODE}...`);
    const result = await scraperFn(TEST_PRODUCT, TEST_PINCODE);
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (result.productTitle && result.productTitle.toLowerCase().includes('onion')) {
      console.log('⚠️ WARNING: Found "onion" in product title when searching for milk!');
    }
    
    return result;
  } catch (error) {
    console.error(`Error in ${name} scraper:`, error);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Starting scraper tests...');
  
  // Test each scraper individually
  await testScraper('Blinkit', scrapeBlinkit);
  await testScraper('Zepto', scrapeZepto);
  await testScraper('BigBasket', scrapeBigBasket);
  await testScraper('JioMart', scrapeJioMart);
  
  console.log('\n✅ Testing complete!');
}

// Run the tests
runTests().catch(console.error); 