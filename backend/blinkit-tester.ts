import { scrapeBlinkit } from './src/lib/scrapers/blinkit';

async function runTest() {
  console.log('Starting Blinkit test...');
  try {
    const result = await scrapeBlinkit('milk', '500034');
    console.log('TEST RESULT:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('ERROR:', error);
  }
  console.log('Test completed.');
}

runTest().catch(err => console.error('Unhandled error:', err)); 