#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a temporary NestJS test file
const tempFile = path.join(__dirname, 'src', 'test-blinkit-nest.ts');
const testContent = `
import { scrapeBlinkit } from './lib/scrapers/blinkit';

/**
 * Test script for Blinkit scraper
 */
async function main() {
  try {
    console.log('Testing Blinkit scraper with milk and pincode 500034');
    const result = await scrapeBlinkit('milk', '500034');
    console.log('RESULT:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('ERROR:', error);
  }
}

// Run the test
main();
`;

// Write the test file
fs.writeFileSync(tempFile, testContent);
console.log(`Created test file at ${tempFile}`);

try {
  // Run the test using the NestJS compiler
  console.log('Running test with NestJS...');
  execSync('npx nest start --entryFile test-blinkit-nest', { stdio: 'inherit' });
} catch (error) {
  console.error('Error running test:', error.message);
} finally {
  // Clean up the temporary file
  fs.unlinkSync(tempFile);
  console.log('Cleaned up temporary file');
} 