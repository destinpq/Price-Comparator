const http = require('http');

// Test parameters
const baseUrl = 'http://localhost:3000';

// Test the healthcheck endpoint first to verify API is running
const healthcheckUrl = `${baseUrl}/api/healthcheck`;
console.log(`Testing healthcheck API: ${healthcheckUrl}`);

const req = http.get(healthcheckUrl, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('Response data:', jsonData);
      
      // If healthcheck passes, try the mock-prices endpoint
      if (res.statusCode === 200) {
        testMockPricesEndpoint();
      }
    } catch (e) {
      console.log('Raw response (not JSON):');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

function testMockPricesEndpoint() {
  const item = 'milk';
  const pincode = '400001';
  const mockPricesUrl = `${baseUrl}/api/mock-prices?item=${item}&pincode=${pincode}`;
  console.log(`\nTesting mock-prices API: ${mockPricesUrl}`);
  
  const mockReq = http.get(mockPricesUrl, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('Response data:', jsonData);
      } catch (e) {
        console.log('Raw response (not JSON):');
        console.log(data);
      }
    });
  });
  
  mockReq.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });
} 