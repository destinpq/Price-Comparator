import { scrapeBlinkit } from './blinkit';

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
