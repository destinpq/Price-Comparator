// Simple test script to directly test the Blinkit scraper
const { spawn } = require('child_process');

// Run this with: node test-direct.js
async function main() {
  // Run a script through Next.js to properly handle TS imports
  const nextProcess = spawn('npx', ['next', 'dev'], {
    stdio: 'inherit',
    detached: true
  });
  
  console.log('Next.js dev server started...');
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Make a direct request to the API for testing
  const testProcess = spawn('curl', ['http://localhost:3000/api/mock-prices?item=milk&pincode=500034'], {
    stdio: 'inherit'
  });
  
  testProcess.on('close', (code) => {
    console.log(`Test finished with code ${code}`);
    // Kill the Next.js process
    process.kill(-nextProcess.pid);
    process.exit(0);
  });
}

main().catch(console.error); 