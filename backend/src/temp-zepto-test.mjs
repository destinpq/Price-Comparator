
      import { scrapeZepto } from './lib/scrapers/zepto';
      
      async function test() {
        try {
          console.log('Starting test...');
          const result = await scrapeZepto('milk', '500034');
          console.log('Result:', JSON.stringify(result, null, 2));
          
          // Validate fields
          console.log('\nValidation:');
          console.log('- Platform:', result.platform);
          console.log('- Product:', result.productTitle || 'Not available');
          console.log('- Price:', result.price || 'Not available');
          console.log('- Original Price:', result.originalPrice || 'Not available');
          console.log('- Discount:', result.discount || 'Not available');
          console.log('- Quantity:', result.quantity || 'Not available');
          console.log('- Available:', result.available ? 'Yes' : 'No');
          console.log('- Delivery ETA:', result.deliveryEta || 'Not available');
          
          console.log('\nTEST PASSED ✅');
        } catch (error) {
          console.error('\nTEST FAILED ❌');
          console.error('Error:', error);
        }
      }
      
      test();
    