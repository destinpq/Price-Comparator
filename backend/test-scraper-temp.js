/**
 * Test script for scrapers that creates and runs a temporary ESM file
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a temporary ESM script for testing a single scraper
function testScraper(scraperName, functionName, query = 'milk', pincode = '500034') {
  console.log(`\n=== Testing ${scraperName} scraper with "${query}" pincode "${pincode}" ===\n`);

  const tempFilePath = path.join(__dirname, `_temp_${scraperName}_test.mjs`);

  // Create the test script
  const script = `
// ESM test script for ${scraperName}
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ${functionName} } from './src/lib/scrapers/${scraperName}.js';

// Set up proper module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTest() {
  console.log('Running ${functionName} with ${query} and ${pincode}...');
  
  try {
    const result = await ${functionName}('${query}', '${pincode}');
    console.log('\\nRESULT:');
    console.log(JSON.stringify(result, null, 2));
    
    // Check fields
    console.log('\\nFields:');
    console.log('Platform:', result.platform);
    console.log('Product Title:', result.productTitle || 'N/A');
    console.log('Price:', result.price || 'N/A');
    console.log('Original Price:', result.originalPrice || 'N/A');
    console.log('Discount:', result.discount || 'N/A');
    console.log('Quantity:', result.quantity || 'N/A');
    console.log('Available:', result.available ? 'Yes' : 'No');
    console.log('Delivery ETA:', result.deliveryEta || 'N/A');
    
    console.log('\\nTEST PASSED ✅');
    process.exit(0);
  } catch (error) {
    console.error('\\nTEST FAILED ❌');
    console.error('Error:', error);
    process.exit(1);
  }
}

runTest();
`;

  // Write the temporary file
  fs.writeFileSync(tempFilePath, script);
  console.log(`Created temporary test file: ${tempFilePath}`);

  // Run the file with Node.js and experimental module resolution
  try {
    console.log('Running test...');
    const result = spawnSync('node', 
      ['--experimental-specifier-resolution=node', tempFilePath], 
      { stdio: 'inherit' }
    );
    
    if (result.status === 0) {
      console.log(`\n${scraperName} test SUCCEEDED ✅\n`);
    } else {
      console.error(`\n${scraperName} test FAILED ❌\n`);
    }
  } catch (error) {
    console.error(`Error running test: ${error.message}`);
  } finally {
    // Clean up
    try {
      fs.unlinkSync(tempFilePath);
      console.log('Removed temporary test file');
    } catch (err) {
      console.error(`Failed to clean up: ${err.message}`);
    }
  }
}

// Run all scrapers or just one
function main() {
  const args = process.argv.slice(2);
  const specificScraper = args[0];
  
  const scrapers = [
    { name: 'blinkit', function: 'scrapeBlinkit' },
    { name: 'zepto', function: 'scrapeZepto' },
    { name: 'bigbasket', function: 'scrapeBigBasket' }, // Note the capital B
    { name: 'jiomart', function: 'scrapeJioMart' },     // Note the capital M
    { name: 'dmart', function: 'scrapeDmart' },
    { name: 'instamart', function: 'scrapeInstamart' }
  ];
  
  if (specificScraper) {
    // Find and run just one scraper
    const scraperToRun = scrapers.find(s => s.name === specificScraper);
    if (scraperToRun) {
      testScraper(scraperToRun.name, scraperToRun.function);
    } else {
      console.error(`Scraper "${specificScraper}" not found. Available scrapers: ${scrapers.map(s => s.name).join(', ')}`);
    }
  } else {
    // Run all scrapers
    console.log("Testing all scrapers with milk and pincode 500034");
    for (const scraper of scrapers) {
      testScraper(scraper.name, scraper.function);
    }
    console.log("\nAll tests completed");
  }
}

// Run the script
main(); 