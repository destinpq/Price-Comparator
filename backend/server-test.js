/**
 * Simple server test to verify the API is functioning
 */
const { exec } = require('child_process');

// Test API status
async function testApiStatus() {
  console.log('Testing API status...');
  
  // Run curl to check the API
  exec('curl http://localhost:3000/api/get-prices?item=milk&pincode=500034', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing curl: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Curl stderr: ${stderr}`);
      return;
    }
    
    console.log('API response:');
    
    try {
      // Try to parse the response
      const data = JSON.parse(stdout);
      console.log('API is working! Response parsed successfully.');
      console.log(`- Item: ${data.item}`);
      console.log(`- Pincode: ${data.pincode}`);
      console.log(`- Results: ${data.results ? data.results.length : 0}`);
      console.log(`- Timestamp: ${data.timestamp}`);
    } catch (e) {
      console.error('Failed to parse API response:');
      console.log(stdout);
    }
  });
}

// Run the tests
testApiStatus(); 