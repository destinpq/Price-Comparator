// Direct test for Blinkit scraper in NestJS context
const { scrapeBlinkit } = require('./lib/scrapers/blinkit');

// Use an IIFE to enable async/await
(async () => {
  try {
    console.log('Starting Blinkit scraper test with pincode 500034 and query "milk"...');
    
    const result = await scrapeBlinkit('milk', '500034');
    
    console.log('TEST RESULT:');
    console.log(JSON.stringify(result, null, 2));
    
    // Check if we got expected data structure
    if (result.productTitle) {
      console.log('\nSUCCESS: Got product title:', result.productTitle);
      console.log('Price:', result.price);
      console.log('Quantity:', result.quantity);
      console.log('Available:', result.available);
      console.log('Delivery ETA:', result.deliveryEta);
      console.log('Image URL length:', result.imageUrl ? result.imageUrl.length : 'N/A');
      
      if (result.originalPrice) {
        console.log('Original Price:', result.originalPrice);
      }
      
      if (result.discount) {
        console.log('Discount:', result.discount);
      }
    } else {
      console.log('\nERROR: Failed to get product information');
      console.log('Error message:', result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Error running test:', error);
  }
})(); 