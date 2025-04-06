/**
 * Direct test script for testing scrapers with Next.js dev infrastructure
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test parameters
const QUERY = 'milk';
const PINCODE = '500034';

console.log(`\n=== Testing scrapers with query "${QUERY}" and pincode "${PINCODE}" ===\n`);

// Create a simple test script that can be run with ts-node through next
function testScraper(scraperName, functionName) {
  console.log(`\n--- Testing ${scraperName} scraper ---\n`);
  
  // Create a temporary test file that uses the Next.js import path resolution
  const tempFilePath = path.join(__dirname, `temp-${scraperName}-test.ts`);
  
  // Test content
  const testContent = `
import { ${functionName} } from '@/lib/scrapers/${scraperName}';

// Main test function
async function runTest() {
  console.log('Starting ${scraperName} test with pincode ${PINCODE}...');
  
  try {
    const result = await ${functionName}('${QUERY}', '${PINCODE}');
    
    console.log('\\nRESULT:');
    console.log(JSON.stringify(result, null, 2));
    
    // Validate fields
    console.log('\\nFields:');
    console.log('- Platform:', result.platform);
    console.log('- Product Title:', result.productTitle || 'N/A');
    console.log('- Price:', result.price || 'N/A');
    console.log('- Original Price:', result.originalPrice || 'N/A');
    console.log('- Discount:', result.discount || 'N/A');
    console.log('- Quantity:', result.quantity || 'N/A');
    console.log('- Available:', result.available ? 'Yes' : 'No');
    console.log('- Delivery ETA:', result.deliveryEta || 'N/A');
    
    console.log('\\nTEST PASSED ✅');
  } catch (error) {
    console.error('\\nTEST FAILED ❌');
    console.error('Error:', error);
  }
}

// Run the test
runTest().catch(err => console.error(err));
`;
  
  // Write the test file
  fs.writeFileSync(tempFilePath, testContent);
  
  // Run with Next.js ts-node integration
  try {
    const result = spawnSync('npx', ['next', 'exec', tempFilePath], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development'
      }
    });
    
    if (result.status === 0) {
      console.log(`\n${scraperName} test SUCCEEDED! ✅\n`);
    } else {
      console.error(`\n${scraperName} test FAILED! ❌\n`);
    }
  } catch (error) {
    console.error(`Error running ${scraperName} test:`, error.message);
  } finally {
    // Clean up
    try {
      fs.unlinkSync(tempFilePath);
    } catch (err) {
      // Ignore cleanup errors
    }
  }
}

// Scraper configurations - function name must match export
const scrapers = [
  { name: 'blinkit', function: 'scrapeBlinkit' },
  { name: 'zepto', function: 'scrapeZepto' },
  { name: 'bigbasket', function: 'scrapeBigBasket' },  // Note capitalization
  { name: 'jiomart', function: 'scrapeJioMart' },      // Note capitalization
  { name: 'dmart', function: 'scrapeDmart' },
  { name: 'instamart', function: 'scrapeInstamart' }
];

// Run all tests
function runAllTests() {
  for (const scraper of scrapers) {
    testScraper(scraper.name, scraper.function);
  }
  
  console.log('\n=== All tests completed ===\n');
}

// Run the tests
runAllTests(); 