
import { scrapeZepto } from './lib/scrapers/zepto';

async function runTest() {
  console.log('Starting test...');
  
  try {
    const result = await scrapeZepto('milk', '500034');
    
    console.log('\nRESULT:');
    console.log(JSON.stringify(result, null, 2));
    
    // Validate fields
    console.log('\nFields:');
    console.log('Platform:', result.platform);
    console.log('Product Title:', result.productTitle || 'N/A');
    console.log('Price:', result.price || 'N/A');
    console.log('Original Price:', result.originalPrice || 'N/A');
    console.log('Discount:', result.discount || 'N/A');
    console.log('Quantity:', result.quantity || 'N/A');
    console.log('Available:', result.available ? 'Yes' : 'No');
    console.log('Delivery ETA:', result.deliveryEta || 'N/A');
    
    console.log('\nTEST PASSED ✅');
  } catch (error) {
    console.error('\nTEST FAILED ❌');
    console.error('Error:', error);
  }
}

// Run the test
runTest();
