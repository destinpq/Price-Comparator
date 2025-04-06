/**
 * Simple direct test for blinkit scraper
 * Run with: node test-blinkit-direct.js
 */
const { exec } = require('child_process');

// Test parameters
const QUERY = 'milk';
const PINCODE = '500034';

console.log(`Testing Blinkit scraper with query "${QUERY}" and pincode "${PINCODE}"`);

// Execute directly using ts-node
exec('npx ts-node -e "import { scrapeBlinkit } from \'./src/lib/scrapers/blinkit\'; async function test() { try { console.log(\'Starting test...\'); const result = await scrapeBlinkit(\'milk\', \'500034\'); console.log(\'RESULT:\', JSON.stringify(result, null, 2)); } catch(error) { console.error(\'Error:\', error); } }; test();"', 
  { timeout: 60000 },
  (error, stdout, stderr) => {
    if (stderr) {
      console.error('Error output:');
      console.error(stderr);
    }
    
    if (error) {
      console.error('Execution error:', error.message);
      return;
    }
    
    console.log('Test output:');
    console.log(stdout);
    
    console.log('Test completed.');
  }
); 