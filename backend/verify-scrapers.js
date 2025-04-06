/**
 * Simple test script to verify each scraper individually
 */
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test parameters
const QUERY = 'milk';
const PINCODE = '500034';

console.log(`\n=== Testing scrapers for "${QUERY}" with pincode "${PINCODE}" ===\n`);

// We'll use ts-node to execute each scraper individually
const scrapers = [
  'blinkit',
  'zepto',
  'bigbasket',
  'jiomart', 
  'dmart',
  'instamart'
];

// Create a temporary test file for each scraper
async function testScraper(name) {
  console.log(`\n--- Testing ${name} scraper ---`);
  
  const testFile = `
  import { scrape${name.charAt(0).toUpperCase() + name.slice(1)} } from './src/lib/scrapers/${name}';
  
  async function test() {
    try {
      console.log('Starting test...');
      const result = await scrape${name.charAt(0).toUpperCase() + name.slice(1)}('${QUERY}', '${PINCODE}');
      console.log('Result:', JSON.stringify(result, null, 2));
      
      // Validate fields
      console.log('\\nValidation:');
      console.log('- Platform:', result.platform);
      console.log('- Product:', result.productTitle || 'N/A');
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
  
  test();
  `;
  
  // Write to temporary file
  const tempFile = path.join(__dirname, `temp-${name}-test.ts`);
  fs.writeFileSync(tempFile, testFile);
  
  try {
    // Use ts-node to run the TypeScript file
    console.log(`Running ${name} test...`);
    
    // Execute command
    const output = await new Promise((resolve, reject) => {
      exec(`npx ts-node ${tempFile}`, {timeout: 60000}, (error, stdout, stderr) => {
        if (stderr) {
          console.error(`Error output: ${stderr}`);
        }
        
        if (error) {
          console.error(`Error running ${name} test: ${error.message}`);
          reject(error);
          return;
        }
        
        resolve(stdout);
      });
    });
    
    console.log(output);
  } catch (error) {
    console.error(`Failed to run ${name} test: ${error.message}`);
  } finally {
    // Clean up
    try {
      fs.unlinkSync(tempFile);
    } catch (error) {
      console.error(`Failed to delete temporary file: ${error.message}`);
    }
  }
}

// Run the tests sequentially
async function runTests() {
  for (const scraper of scrapers) {
    await testScraper(scraper);
  }
  
  console.log('\n=== All tests completed ===\n');
}

runTests().catch(error => {
  console.error('Error running tests:', error);
}); 