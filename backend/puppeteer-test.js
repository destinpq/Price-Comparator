const puppeteer = require('puppeteer');

// Helper function for waiting
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testBlinkitSelectors() {
  console.log('Testing Blinkit selectors directly with Puppeteer...');
  
  // Launch browser with devtools for debugging
  const browser = await puppeteer.launch({
    headless: false, // Use visible browser to debug
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });
  
  try {
    const page = await browser.newPage();
    console.log('Browser launched');
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to main page first
    await page.goto('https://blinkit.com', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Navigated to main page');
    
    // Wait for a moment to let the page detect location
    await wait(2000);
    
    // Check if we need to set location
    const locationModal = await page.$('.location-selector');
    if (locationModal) {
      console.log('Location modal found, setting location manually');
      
      // Click the input field
      await page.click('.location-input');
      await wait(500);
      
      // Type the pincode
      await page.keyboard.type('500034');
      await wait(1000);
      
      // Press Enter to submit
      await page.keyboard.press('Enter');
      await wait(2000);
    } else {
      console.log('No location modal, setting cookie directly');
      // Set a cookie for pincode
      await page.setCookie({
        name: 'dote_pincode',
        value: '500034',
        domain: '.blinkit.com',
        path: '/',
      });
    }
    
    // Navigate to search page
    const searchUrl = `https://blinkit.com/s/?q=milk`;
    console.log(`Navigating to ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Take a screenshot before applying selectors
    await page.screenshot({ path: 'blinkit-before.png' });
    console.log('Initial screenshot saved to blinkit-before.png');
    
    // Get page content to analyze
    const pageContent = await page.content();
    console.log('Page content length:', pageContent.length);
    
    // Look for common elements to check if we're on the right page
    const hasProductGrid = await page.$('.product-grid');
    console.log('Product grid found:', !!hasProductGrid);
    
    // Dump all classes for analysis
    const allClasses = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const classes = new Set();
      elements.forEach(el => {
        if (el.classList) {
          el.classList.forEach(cls => classes.add(cls));
        }
      });
      return Array.from(classes);
    });
    
    console.log('Found classes that contain "tw-":', allClasses.filter(cls => cls.includes('tw-')));
    
    // Test our selectors with more variations
    console.log('\nTesting selectors...');
    
    // Try different title selectors
    const selectors = [
      '.tw-text-300.tw-font-semibold.tw-line-clamp-2',
      '[class*="tw-text-300"][class*="tw-font-semibold"][class*="tw-line-clamp-2"]',
      '.tw-text-300',
      '.tw-font-semibold',
      '.tw-line-clamp-2'
    ];
    
    for (const selector of selectors) {
      const elements = await page.$$(selector);
      console.log(`Selector "${selector}" found ${elements.length} elements`);
      
      if (elements.length > 0) {
        const firstText = await page.evaluate(el => el.textContent, elements[0]);
        console.log(`First text: "${firstText}"`);
      }
    }
    
    // Take another screenshot
    await page.screenshot({ path: 'blinkit-after.png' });
    console.log('Final screenshot saved to blinkit-after.png');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Wait so we can see what's happening
    console.log('Waiting 10 seconds before closing...');
    await wait(10000);
    
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the test
testBlinkitSelectors().catch(console.error); 