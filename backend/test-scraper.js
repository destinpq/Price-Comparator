// Set environment variable to use Next.js transpilation for TypeScript
process.env.NODE_OPTIONS = '--import=next/dist/tools/resolve-esm-hook.js';

// Run with the Next.js CLI to ensure proper transpilation
require('next/dist/cli/next-babel');

async function main() {
  console.log('🧪 Starting scraper tests...');
  
  // Dynamic import since we're dealing with TypeScript modules
  const { scrapeBlinkit } = await import('./src/lib/scrapers/blinkit.js');
  const { scrapeZepto } = await import('./src/lib/scrapers/zepto.js');
  const { scrapeBigBasket } = await import('./src/lib/scrapers/bigbasket.js');
  const { scrapeJioMart } = await import('./src/lib/scrapers/jiomart.js');
  
  // Test product to search for
  const TEST_PRODUCT = 'milk';
  const TEST_PINCODE = '500034'; // Mumbai pincode for testing
  
  async function testScraper(name, scraperFn) {
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
  
  // Test each scraper individually
  try {
    await testScraper('Blinkit', scrapeBlinkit);
  } catch (e) {
    console.error('Blinkit test failed:', e);
  }
  
  try {
    await testScraper('Zepto', scrapeZepto);
  } catch (e) {
    console.error('Zepto test failed:', e);
  }
  
  try {
    await testScraper('BigBasket', scrapeBigBasket);
  } catch (e) {
    console.error('BigBasket test failed:', e);
  }
  
  try {
    await testScraper('JioMart', scrapeJioMart);
  } catch (e) {
    console.error('JioMart test failed:', e);
  }
  
  console.log('\n✅ Testing complete!');
}

main().catch(console.error); 