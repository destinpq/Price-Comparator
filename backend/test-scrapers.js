/**
 * Test script to verify all scrapers are working with the pincode parameter
 * 
 * Run with:
 *   node test-scrapers.js
 */

const { execSync } = require('child_process');

const QUERY = 'milk';
const PINCODE = '500034';

// Show header
console.log('\n=================================================================');
console.log(` TESTING ALL SCRAPERS FOR "${QUERY}" WITH PINCODE "${PINCODE}"`);
console.log('=================================================================\n');

// Create and run a test script for each scraper
const scrapers = [
  'blinkit',
  'zepto', 
  'bigbasket', 
  'jiomart',
  'dmart',
  'instamart'
];

const testScraper = async (scraperName) => {
  console.log(`\n-----------------------------------------------------------------`);
  console.log(`TESTING ${scraperName.toUpperCase()} SCRAPER`);
  console.log(`-----------------------------------------------------------------`);
  
  const testTs = `
const { scrape${scraperName.charAt(0).toUpperCase() + scraperName.slice(1)} } = require('./src/lib/scrapers/${scraperName}');

async function test() {
  try {
    console.log('Starting test...');
    const result = await scrape${scraperName.charAt(0).toUpperCase() + scraperName.slice(1)}('${QUERY}', '${PINCODE}');
    console.log('RESULT:', JSON.stringify(result, null, 2));
    
    // Validate result has expected fields
    if (result.platform) {
      console.log('\\nVALIDATION:');
      console.log('- Platform:', result.platform);
      console.log('- Product Title:', result.productTitle || 'Not available');
      console.log('- Price:', result.price || 'Not available');
      console.log('- Quantity:', result.quantity || 'Not available');
      console.log('- Available:', result.available);
      console.log('- Delivery ETA:', result.deliveryEta || 'Not available');
      
      if (result.originalPrice) {
        console.log('- Original Price:', result.originalPrice);
      }
      
      if (result.discount) {
        console.log('- Discount:', result.discount);
      }
      
      console.log('\\nTEST PASSED ✅');
    } else {
      console.log('\\nTEST FAILED ❌ - Missing platform in result');
    }
  } catch (error) {
    console.error('\\nTEST ERROR ❌:', error);
  }
}

test();
`;

  // Write the test script to a temporary file
  const fs = require('fs');
  const tempFile = `temp-${scraperName}-test.js`;
  fs.writeFileSync(tempFile, testTs);
  
  try {
    console.log(`Running ${scraperName} test...`);
    // Run the test with Node.js (not TypeScript)
    execSync(`node ${tempFile}`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error testing ${scraperName}: ${error.message}`);
  } finally {
    // Clean up
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
};

// Run all tests in sequence
(async () => {
  for (const scraper of scrapers) {
    await testScraper(scraper);
  }
  
  console.log('\n=================================================================');
  console.log(' ALL TESTS COMPLETED');
  console.log('=================================================================\n');
})(); 