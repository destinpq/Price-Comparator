/**
 * Simple script to check interface and function names directly from files
 */
const fs = require('fs');
const path = require('path');

const scrapers = [
  'blinkit',
  'zepto',
  'bigbasket',
  'jiomart',
  'dmart',
  'instamart'
];

// Check the contents of each file
async function checkFile(name) {
  console.log(`\n=== Checking ${name}.ts ===`);
  
  const filePath = path.join(__dirname, 'lib', 'scrapers', `${name}.ts`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for ScrapedResult import
    const importMatch = content.match(/import\s+{[^}]*ScrapedResult[^}]*}\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      console.log(`- ScrapedResult imported from: ${importMatch[1]}`);
    } else {
      console.log('- ScrapedResult not imported directly');
    }
    
    // Check for function export
    const funcMatch = content.match(/export\s+async\s+function\s+(\w+)/);
    if (funcMatch) {
      console.log(`- Main function exported as: ${funcMatch[1]}`);
    } else {
      console.log('- Could not identify main function export');
    }
    
    // Check for return type
    const returnTypeMatch = content.match(/Promise<([^>]+)>/);
    if (returnTypeMatch) {
      console.log(`- Return type: ${returnTypeMatch[1]}`);
    } else {
      console.log('- Could not identify return type');
    }
    
    // Check for originalPrice and discount fields
    if (content.includes('originalPrice')) {
      console.log('- originalPrice field is present');
    } else {
      console.log('- originalPrice field not found');
    }
    
    if (content.includes('discount')) {
      console.log('- discount field is present');
    } else {
      console.log('- discount field not found');
    }
    
    // Check for pincode parameter
    const pincodeMatch = content.match(/function\s+\w+\s*\(\s*\w+\s*:\s*\w+\s*,\s*(\w+)\s*:/);
    if (pincodeMatch) {
      console.log(`- Second parameter named: ${pincodeMatch[1]}`);
    } else {
      console.log('- Could not identify second parameter name');
    }
    
  } catch (error) {
    console.error(`Error reading ${name}.ts:`, error.message);
  }
}

// Check interface file
function checkInterfaceFile() {
  console.log('\n=== Checking interfaces in index.ts ===');
  
  const filePath = path.join(__dirname, 'lib', 'scrapers', 'index.ts');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for ScraperResult interface
    const interfaceMatch = content.match(/export\s+interface\s+ScraperResult\s+{([^}]+)}/s);
    if (interfaceMatch) {
      console.log('- ScraperResult interface found');
      
      const fields = interfaceMatch[1];
      
      if (fields.includes('originalPrice')) {
        console.log('- originalPrice field is present in ScraperResult');
      } else {
        console.log('- originalPrice field not found in ScraperResult');
      }
      
      if (fields.includes('discount')) {
        console.log('- discount field is present in ScraperResult');
      } else {
        console.log('- discount field not found in ScraperResult');
      }
    } else {
      console.log('- ScraperResult interface not found');
    }
    
    // Check for imported ScrapedResult
    const importedInterfaceMatch = content.match(/import\s+{[^}]*(\w+)\s+as\s+ScrapedResult[^}]*}\s+from/);
    if (importedInterfaceMatch) {
      console.log(`- ScrapedResult imported from original name: ${importedInterfaceMatch[1]}`);
    } else {
      console.log('- ScrapedResult import not found');
    }
    
  } catch (error) {
    console.error('Error reading index.ts:', error.message);
  }
}

// Run the checks
async function runChecks() {
  console.log('Checking scraper files and interfaces...');
  
  // Check each scraper file
  for (const scraper of scrapers) {
    await checkFile(scraper);
  }
  
  // Check interface file
  checkInterfaceFile();
  
  console.log('\nCheck complete!');
}

runChecks(); 