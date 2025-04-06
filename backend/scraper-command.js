/**
 * Instructions for testing the Blinkit scraper
 * 
 * Due to complications with module systems and Next.js integration,
 * the best way to test the scraper is through the actual Next.js API route.
 */

console.log(`
To test the updated Blinkit scraper with pincode 500034 and "milk" query:

1. Make sure the Next.js development server is running:
   npx next dev

2. In another terminal, call the API endpoint:
   curl "http://localhost:3000/api/get-prices?item=milk&pincode=500034"

Alternatively, you can add a test command to package.json:

  "scripts": {
    "test-blinkit": "cross-env NODE_OPTIONS='--experimental-specifier-resolution=node' ts-node --esm src/lib/scrapers/test-blinkit.mjs"
  },

Then create a test file at src/lib/scrapers/test-blinkit.mjs:

import { scrapeBlinkit } from './blinkit.js';

async function runTest() {
  try {
    console.log('Testing Blinkit scraper for "milk" at pincode 500034...');
    const result = await scrapeBlinkit('milk', '500034');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

runTest();
`);

// Create the test file for the user
const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, 'src', 'lib', 'scrapers');
const testFilePath = path.join(testDir, 'test-blinkit.mjs');

// Only create if the directory exists
if (fs.existsSync(testDir)) {
  const testFileContent = `
import { scrapeBlinkit } from './blinkit.js';

async function runTest() {
  try {
    console.log('Testing Blinkit scraper for "milk" at pincode 500034...');
    const result = await scrapeBlinkit('milk', '500034');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

runTest();
`;

  try {
    fs.writeFileSync(testFilePath, testFileContent);
    console.log(`\nCreated test file at: ${testFilePath}`);
    console.log('You can now add the test-blinkit script to package.json and run it with:');
    console.log('npm run test-blinkit');
  } catch (err) {
    console.error('Could not create test file:', err.message);
  }
} 