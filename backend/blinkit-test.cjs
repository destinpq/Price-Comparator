// CommonJS test script for Blinkit scraper
const { execSync } = require('child_process');

/* global console */

console.log('Testing Blinkit scraper with milk and pincode 500034');

// Use ts-node to run the test script
try {
  // Create a temporary file
  const testCode = `
  import { scrapeBlinkit } from './src/lib/scrapers/blinkit';
  
  async function main() {
    try {
      console.log('Starting scrape test...');
      const result = await scrapeBlinkit('milk', '500034');
      console.log(JSON.stringify(result, null, 2));
      console.log('Done.');
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  main();
  `;
  
  // Write this to a temporary file
  require('fs').writeFileSync('./temp-test.ts', testCode);
  
  // Run the test with ts-node directly
  console.log('Running scraper test...');
  const output = execSync('npx ts-node --esm --experimental-specifier-resolution=node ./temp-test.ts', { 
    encoding: 'utf-8',
    stdio: 'inherit'
  });
  
  console.log('Test output:', output);
} catch (error) {
  console.error('Error running test:', error);
} finally {
  // Clean up the temporary file
  try {
    require('fs').unlinkSync('./temp-test.ts');
  } catch (_) {
    // Ignore errors on cleanup
  }
} 