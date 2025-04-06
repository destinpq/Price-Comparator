// Simple script to test the updated Blinkit scraper
import { spawn } from 'child_process';

/* global console */

console.log('Testing Blinkit scraper with milk search in 500034...');

// Use ts-node to run the TypeScript code
const tester = spawn('npx', [
  'ts-node',
  '--esm',
  '--experimental-specifier-resolution=node',
  '-e',
  `
  import { scrapeBlinkit } from './src/lib/scrapers/blinkit';
  
  async function runTest() {
    console.log('Starting Blinkit test...');
    try {
      const result = await scrapeBlinkit('milk', '500034');
      console.log('TEST RESULT:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('ERROR:', error);
    }
  }
  
  runTest().then(() => console.log('Test complete.'));
  `
]);

tester.stdout.on('data', (data) => {
  console.log(`STDOUT: ${data}`);
});

tester.stderr.on('data', (data) => {
  console.error(`STDERR: ${data}`);
});

tester.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
}); 