// CommonJS script to test the API directly
const https = require('https');
const http = require('http');

// Test product to search for
const TEST_PRODUCT = 'milk';
const TEST_PINCODE = '500034'; // Mumbai pincode for testing

function callAPI(endpoint, params) {
  return new Promise((resolve, reject) => {
    const url = `http://localhost:3000/api/${endpoint}?item=${encodeURIComponent(params.item)}&pincode=${encodeURIComponent(params.pincode)}`;
    console.log(`Calling API: ${url}`);
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          console.log('Raw response:', data);
          reject(new Error('Failed to parse JSON: ' + e.message));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log('🧪 Testing Price Comparator API...');
  
  try {
    // First try the mock API
    console.log('\nTesting mock-prices endpoint...');
    const mockResult = await callAPI('mock-prices', {
      item: TEST_PRODUCT,
      pincode: TEST_PINCODE
    });
    
    console.log('Mock API results:');
    if (mockResult.results) {
      mockResult.results.forEach(result => {
        console.log(`- ${result.platform}: "${result.productTitle}" - ${result.price || 'N/A'}`);
      });
    } else {
      console.log(mockResult);
    }
    
    // Then try the live API
    console.log('\nTesting get-prices endpoint...');
    const liveResult = await callAPI('get-prices', {
      item: TEST_PRODUCT,
      pincode: TEST_PINCODE
    });
    
    console.log('Live API results:');
    if (liveResult.results) {
      liveResult.results.forEach(result => {
        console.log(`- ${result.platform}: "${result.productTitle}" - ${result.price || 'N/A'}`);
        if (result.productTitle && result.productTitle.toLowerCase().includes('onion')) {
          console.log('  ⚠️ WARNING: Found "onion" in product title when searching for milk!');
        }
      });
    } else {
      console.log(liveResult);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
  
  console.log('\n✅ Test complete!');
}

main(); 