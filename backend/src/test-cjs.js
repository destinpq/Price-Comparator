/**
 * CommonJS test for scrapers
 */

// We need to use the transpiled JavaScript files
// First check if they exist in the .next/server directory
const fs = require('fs');
const path = require('path');

// Set up paths
const nextBuildDir = path.join(__dirname, '..', '.next', 'server', 'app');
const libPath = path.join(__dirname, 'lib', 'scrapers');

console.log('Checking for modules...');
console.log('- nextBuildDir:', nextBuildDir);
console.log('- libPath:', libPath);

// List the directories to see what's available
try {
  if (fs.existsSync(libPath)) {
    console.log('\nContents of scrapers directory:');
    fs.readdirSync(libPath).forEach(file => {
      console.log(`- ${file}`);
    });
  } else {
    console.log('Scrapers directory not found');
  }
  
  if (fs.existsSync(nextBuildDir)) {
    console.log('\nContents of Next.js build directory:');
    fs.readdirSync(nextBuildDir).forEach(file => {
      console.log(`- ${file}`);
    });
  } else {
    console.log('Next.js build directory not found');
  }
} catch (err) {
  console.error('Error checking directories:', err);
}

// Since we can't directly require TypeScript files, let's examine what files we have
console.log('\nDirectory exploration complete.');
console.log('Use the transpiled JavaScript files if available, otherwise compile through ts-node');

// Since direct access to TypeScript modules is challenging,
// we'll execute the code through ts-node
const { execSync } = require('child_process');

function runTest(scraperName, functionName, query = 'milk', pincode = '500034') {
  console.log(`\n=== Testing ${scraperName} scraper ===`);
  
  try {
    // Create a temporary script to test the scraper
    const tempScript = `
      import { ${functionName} } from './lib/scrapers/${scraperName}';
      
      async function test() {
        try {
          console.log('Starting test...');
          const result = await ${functionName}('${query}', '${pincode}');
          console.log('Result:', JSON.stringify(result, null, 2));
          
          // Validate fields
          console.log('\\nValidation:');
          console.log('- Platform:', result.platform);
          console.log('- Product:', result.productTitle || 'Not available');
          console.log('- Price:', result.price || 'Not available');
          console.log('- Original Price:', result.originalPrice || 'Not available');
          console.log('- Discount:', result.discount || 'Not available');
          console.log('- Quantity:', result.quantity || 'Not available');
          console.log('- Available:', result.available ? 'Yes' : 'No');
          console.log('- Delivery ETA:', result.deliveryEta || 'Not available');
          
          console.log('\\nTEST PASSED ✅');
        } catch (error) {
          console.error('\\nTEST FAILED ❌');
          console.error('Error:', error);
        }
      }
      
      test();
    `;
    
    // Write the temp script to a file
    const tempFile = path.join(__dirname, `temp-${scraperName}-test.mjs`);
    fs.writeFileSync(tempFile, tempScript);
    
    console.log(`Running test with ts-node...`);
    
    // Run with ts-node in ESM mode
    const result = execSync(`npx ts-node --esm "${tempFile}"`, { 
      env: { ...process.env, NODE_OPTIONS: '--experimental-specifier-resolution=node' }
    });
    
    console.log(result.toString());
    
    // Clean up
    fs.unlinkSync(tempFile);
  } catch (error) {
    console.error(`Error running test: ${error.message}`);
    if (error.stdout) console.log(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
  }
}

// Test each scraper with the correct function name
runTest('blinkit', 'scrapeBlinkit');
runTest('zepto', 'scrapeZepto');
runTest('bigbasket', 'scrapeBigBasket'); // Note the capital B
runTest('jiomart', 'scrapeJioMart'); // Note the capital M
runTest('dmart', 'scrapeDmart');
runTest('instamart', 'scrapeInstamart'); 