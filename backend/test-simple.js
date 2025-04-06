/**
 * Simple test script for the price comparison API
 */
const http = require('http');

async function testPriceComparison() {
  console.log('Testing Price Comparison API');
  
  // Test parameters
  const query = 'milk';
  const pincode = '500034';
  
  // Create options for the request
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/get-prices?item=${encodeURIComponent(query)}&pincode=${pincode}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // Make the HTTP request
  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    
    // A chunk of data has been received
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    // The whole response has been received
    res.on('end', () => {
      try {
        // Parse the data
        const parsedData = JSON.parse(data);
        
        // Log a summary
        console.log('\nAPI Response Summary:');
        console.log(`- Query: ${query}`);
        console.log(`- Pincode: ${pincode}`);
        console.log(`- Timestamp: ${parsedData.timestamp}`);
        console.log(`- Results: ${parsedData.results.length}`);
        
        // Log details for each platform
        console.log('\nResults by Platform:');
        parsedData.results.forEach(result => {
          console.log(`\n${result.platform}:`);
          console.log(`- Product: ${result.productTitle || 'N/A'}`);
          console.log(`- Price: ${result.price || 'N/A'}`);
          console.log(`- Original Price: ${result.originalPrice || 'N/A'}`);
          console.log(`- Discount: ${result.discount || 'N/A'}`);
          console.log(`- Available: ${result.available ? 'Yes' : 'No'}`);
          
          if (result.error) {
            console.log(`- Error: ${result.error}`);
          }
        });
        
        console.log('\nTest completed successfully');
      } catch (e) {
        console.error('Error parsing response:', e);
        console.error('Raw response:', data);
      }
    });
  });
  
  // Handle errors
  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });
  
  // End the request
  req.end();
}

// Run the test
testPriceComparison(); 