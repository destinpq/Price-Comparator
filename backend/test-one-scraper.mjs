// ES Module script to test a single scraper
// Run with: NODE_OPTIONS='--experimental-specifier-resolution=node' node test-one-scraper.mjs

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test parameters
const QUERY = 'milk';
const PINCODE = '500034';

// Function to run a scraper test using ts-node
function testScraper(scraperName, functionName) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== Testing ${scraperName} scraper with query "${QUERY}" and pincode "${PINCODE}" ===\n`);
    
    // Create test script content
    const testScript = `
      import { ${functionName} } from './src/lib/scrapers/${scraperName}';
      
      async function main() {
        try {
          console.log('Starting scraper...');
          const result = await ${functionName}('${QUERY}', '${PINCODE}');
          console.log('\\nRESULT:', JSON.stringify(result, null, 2));
          
          // Log individual fields
          console.log('\\nFields:');
          console.log('Platform:', result.platform);
          console.log('Product Title:', result.productTitle || 'N/A');
          console.log('Price:', result.price || 'N/A');
          console.log('Original Price:', result.originalPrice || 'N/A');
          console.log('Discount:', result.discount || 'N/A');
          console.log('Quantity:', result.quantity || 'N/A');
          console.log('Available:', result.available ? 'Yes' : 'No');
          console.log('Delivery ETA:', result.deliveryEta || 'N/A');
          
          console.log('\\nTest completed successfully ✅');
          process.exit(0);
        } catch (error) {
          console.error('\\nTest failed ❌');
          console.error('Error:', error);
          process.exit(1);
        }
      }
      
      main();
    `;
    
    // Create temporary test file
    const tempScriptPath = join(__dirname, `_temp_${scraperName}_test.mjs`);
    fs.writeFileSync(tempScriptPath, testScript);
    
    // Execute with Node and ts-node
    const cmd = spawn('npx', [
      'ts-node', 
      '--esm', 
      tempScriptPath
    ], {
      env: {
        ...process.env,
        NODE_OPTIONS: '--experimental-specifier-resolution=node'
      }
    });
    
    let output = '';
    let errorOutput = '';
    
    cmd.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });
    
    cmd.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text);
    });
    
    cmd.on('close', (code) => {
      // Delete temp file
      try {
        fs.unlinkSync(tempScriptPath);
      } catch (err) {
        console.error(`Could not delete temp file: ${err.message}`);
      }
      
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Test for ${scraperName} failed with code ${code}\n${errorOutput}`));
      }
    });
  });
}

// Main function to run tests
async function runTests() {
  try {
    // Map of scraper names to function names
    const scrapersToTest = [
      { name: 'blinkit', function: 'scrapeBlinkit' },
      { name: 'zepto', function: 'scrapeZepto' },
      { name: 'bigbasket', function: 'scrapeBigBasket' },  // Note the capital B
      { name: 'jiomart', function: 'scrapeJioMart' },  // Note the capital M
      { name: 'dmart', function: 'scrapeDmart' },
      { name: 'instamart', function: 'scrapeInstamart' }
    ];
    
    // Test each scraper - comment out all but one to test individually
    for (const scraper of scrapersToTest) {
      try {
        await testScraper(scraper.name, scraper.function);
        console.log(`\n${scraper.name} test PASSED ✅\n`);
      } catch (error) {
        console.error(`\n${scraper.name} test FAILED ❌: ${error.message}\n`);
      }
    }
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests(); 