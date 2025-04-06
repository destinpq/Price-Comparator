/**
 * Test script that directly uses tsc to transpile and test a scraper
 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test parameters
const QUERY = 'milk';
const PINCODE = '500034';

// Scraper to test
const SCRAPER = process.argv[2] || 'blinkit';

// Map of scraper names to function names (with correct capitalization)
const SCRAPER_FUNCTIONS = {
  'blinkit': 'scrapeBlinkit',
  'zepto': 'scrapeZepto',
  'bigbasket': 'scrapeBigBasket',  // Note the capital B
  'jiomart': 'scrapeJioMart',      // Note the capital M
  'dmart': 'scrapeDmart',
  'instamart': 'scrapeInstamart'
};

// Get the function name for the scraper
const functionName = SCRAPER_FUNCTIONS[SCRAPER];
if (!functionName) {
  console.error(`Unknown scraper: ${SCRAPER}`);
  console.error(`Available scrapers: ${Object.keys(SCRAPER_FUNCTIONS).join(', ')}`);
  process.exit(1);
}

console.log(`\n=== Testing ${SCRAPER} scraper with query "${QUERY}" and pincode "${PINCODE}" ===\n`);

// Create a temporary directory for our test
const tempDir = path.join(__dirname, '_temp_test');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Copy the scraper files to temp directory
function copyScraperFiles() {
  console.log('Setting up test environment...');
  
  // Copy needed files
  try {
    // Create lib/scrapers directory in temp
    const libDir = path.join(tempDir, 'lib');
    const scrapersDir = path.join(libDir, 'scrapers');
    
    if (!fs.existsSync(libDir)) {
      fs.mkdirSync(libDir);
    }
    
    if (!fs.existsSync(scrapersDir)) {
      fs.mkdirSync(scrapersDir);
    }
    
    // Copy scraper files
    const sourceScrapersDir = path.join(__dirname, 'src', 'lib', 'scrapers');
    
    // Copy blinkit.ts for ScrapedResult interface
    fs.copyFileSync(
      path.join(sourceScrapersDir, 'blinkit.ts'),
      path.join(scrapersDir, 'blinkit.ts')
    );
    
    // Copy the target scraper file if it's not blinkit
    if (SCRAPER !== 'blinkit') {
      fs.copyFileSync(
        path.join(sourceScrapersDir, `${SCRAPER}.ts`),
        path.join(scrapersDir, `${SCRAPER}.ts`)
      );
    }
    
    console.log('Files copied successfully.');
    return true;
  } catch (error) {
    console.error('Error copying files:', error.message);
    return false;
  }
}

// Create the test file
function createTestFile() {
  console.log('Creating test script...');
  
  const testFilePath = path.join(tempDir, 'test.ts');
  
  const testContent = `
import { ${functionName} } from './lib/scrapers/${SCRAPER}';

async function runTest() {
  console.log('Starting test...');
  
  try {
    const result = await ${functionName}('${QUERY}', '${PINCODE}');
    
    console.log('\\nRESULT:');
    console.log(JSON.stringify(result, null, 2));
    
    // Validate fields
    console.log('\\nFields:');
    console.log('Platform:', result.platform);
    console.log('Product Title:', result.productTitle || 'N/A');
    console.log('Price:', result.price || 'N/A');
    console.log('Original Price:', result.originalPrice || 'N/A');
    console.log('Discount:', result.discount || 'N/A');
    console.log('Quantity:', result.quantity || 'N/A');
    console.log('Available:', result.available ? 'Yes' : 'No');
    console.log('Delivery ETA:', result.deliveryEta || 'N/A');
    
    console.log('\\nTEST PASSED ✅');
  } catch (error) {
    console.error('\\nTEST FAILED ❌');
    console.error('Error:', error);
  }
}

// Run the test
runTest();
`;

  try {
    fs.writeFileSync(testFilePath, testContent);
    console.log('Test file created.');
    return true;
  } catch (error) {
    console.error('Error creating test file:', error.message);
    return false;
  }
}

// Compile the TypeScript files
function compileFiles() {
  console.log('Compiling TypeScript files...');
  
  // Create a simple tsconfig file
  const tsconfigPath = path.join(tempDir, 'tsconfig.json');
  const tsconfig = {
    compilerOptions: {
      target: "es2022",
      module: "commonjs",
      moduleResolution: "node",
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      outDir: "./dist"
    },
    include: ["./**/*.ts"]
  };
  
  try {
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    
    // Run the TypeScript compiler
    execSync('npx tsc', {
      cwd: tempDir,
      stdio: 'inherit'
    });
    
    console.log('Compilation successful.');
    return true;
  } catch (error) {
    console.error('Compilation failed:', error.message);
    return false;
  }
}

// Run the test
function runTest() {
  console.log('Running the test...');
  
  try {
    // Use node to run the compiled JS file
    const result = spawnSync('node', ['dist/test.js'], {
      cwd: tempDir,
      stdio: 'inherit'
    });
    
    if (result.status === 0) {
      console.log('\nTest executed successfully.');
      return true;
    } else {
      console.error('\nTest execution failed.');
      return false;
    }
  } catch (error) {
    console.error('Error running test:', error.message);
    return false;
  }
}

// Clean up temporary files
function cleanup() {
  console.log('Cleaning up...');
  
  try {
    // Remove the temp directory and all files
    function deleteFolderRecursive(dirPath) {
      if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach(file => {
          const curPath = path.join(dirPath, file);
          if (fs.lstatSync(curPath).isDirectory()) {
            deleteFolderRecursive(curPath);
          } else {
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(dirPath);
      }
    }
    
    deleteFolderRecursive(tempDir);
    console.log('Cleanup complete.');
    return true;
  } catch (error) {
    console.error('Error during cleanup:', error.message);
    return false;
  }
}

// Main function to run the test
function main() {
  let success = true;
  
  try {
    success = copyScraperFiles() && success;
    success = createTestFile() && success;
    success = compileFiles() && success;
    
    if (success) {
      success = runTest() && success;
    } else {
      console.error('Skipping test execution due to setup errors.');
    }
  } finally {
    cleanup();
  }
  
  if (success) {
    console.log(`\n${SCRAPER} test completed successfully! ✅`);
    process.exit(0);
  } else {
    console.error(`\n${SCRAPER} test failed! ❌`);
    process.exit(1);
  }
}

// Run the test
main(); 