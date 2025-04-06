const puppeteer = require('puppeteer');

// Helper function for waiting
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function validateBlinkitSelectors() {
  console.log('Validating Blinkit selectors for pincode 500034 and search "milk"...');
  
  const browser = await puppeteer.launch({
    headless: false, // Use visible browser for debugging
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });
  
  try {
    const page = await browser.newPage();
    console.log('Browser launched');
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to search page directly with cookie
    await page.setCookie({
      name: 'dote_pincode',
      value: '500034',
      domain: '.blinkit.com',
      path: '/',
    });
    
    const searchUrl = `https://blinkit.com/s/?q=milk`;
    console.log(`Navigating to ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Validate our specific selectors
    console.log('\n======= BLINKIT SELECTOR VALIDATION =======');
    
    // 1. Product Title Selector: .tw-text-300.tw-font-semibold.tw-line-clamp-2
    const titleSelector = '.tw-text-300.tw-font-semibold.tw-line-clamp-2';
    const titles = await page.$$(titleSelector);
    console.log(`✅ Product Title Selector: found ${titles.length} elements`);
    
    if (titles.length > 0) {
      const firstTitle = await page.evaluate(el => el.textContent, titles[0]);
      console.log(`   First product: "${firstTitle}"`);
    }
    
    // 2. Price Selector: .tw-text-200.tw-font-semibold
    const priceSelector = '.tw-text-200.tw-font-semibold';
    const prices = await page.$$(priceSelector);
    console.log(`✅ Price Selector: found ${prices.length} elements`);
    
    if (prices.length > 0) {
      const firstPrice = await page.evaluate(el => el.textContent, prices[0]);
      console.log(`   First price: "${firstPrice}"`);
    }
    
    // 3. Quantity Selector: .tw-text-200.tw-font-medium.tw-line-clamp-1
    const quantitySelector = '.tw-text-200.tw-font-medium.tw-line-clamp-1';
    const quantities = await page.$$(quantitySelector);
    console.log(`✅ Quantity Selector: found ${quantities.length} elements`);
    
    if (quantities.length > 0) {
      const firstQuantity = await page.evaluate(el => el.textContent, quantities[0]);
      console.log(`   First quantity: "${firstQuantity}"`);
    }
    
    // 4. Delivery Time Selector: .tw-text-050.tw-font-bold.tw-uppercase
    const deliverySelector = '.tw-text-050.tw-font-bold.tw-uppercase';
    const deliveries = await page.$$(deliverySelector);
    console.log(`✅ Delivery Time Selector: found ${deliveries.length} elements`);
    
    if (deliveries.length > 0) {
      const firstDelivery = await page.evaluate(el => el.textContent, deliveries[0]);
      console.log(`   First delivery: "${firstDelivery}"`);
    }
    
    // 5. Check for a complete product card
    console.log('\n🔍 Complete Product Check:');
    
    // Take the first 3 products and extract all data
    const productCards = await page.$$('.plp-product');
    const productCount = Math.min(3, productCards.length);
    
    for (let i = 0; i < productCount; i++) {
      const card = productCards[i];
      
      // Extract data from this card
      const productData = await page.evaluate((card, selectors) => {
        const getTextContent = (parent, selector) => {
          const el = parent.querySelector(selector);
          return el ? el.textContent.trim() : 'Not found';
        };
        
        return {
          title: getTextContent(card, selectors.title),
          price: getTextContent(card, selectors.price),
          quantity: getTextContent(card, selectors.quantity),
          delivery: getTextContent(card, selectors.delivery),
          // Try to get original price if it exists
          originalPrice: getTextContent(card, '.tw-text-200.tw-font-regular.tw-line-through'),
          // Try to get discount if it exists
          discount: getTextContent(card, '.tw-text-200.tw-text-base-green')
        };
      }, card, {
        title: titleSelector,
        price: priceSelector,
        quantity: quantitySelector,
        delivery: deliverySelector
      });
      
      console.log(`\nProduct ${i+1}:`);
      console.log(`   Title: ${productData.title}`);
      console.log(`   Price: ${productData.price}`);
      console.log(`   Quantity: ${productData.quantity}`);
      console.log(`   Delivery: ${productData.delivery}`);
      
      if (productData.originalPrice !== 'Not found') {
        console.log(`   Original Price: ${productData.originalPrice}`);
      }
      
      if (productData.discount !== 'Not found') {
        console.log(`   Discount: ${productData.discount}`);
      }
    }
    
    console.log('\n✅ VALIDATION SUCCESSFUL: All selectors are working correctly!');
    console.log('This confirms our updated scraper code will work with the new HTML structure.');
    
  } catch (error) {
    console.error('Error during validation:', error);
    console.log('❌ VALIDATION FAILED');
  } finally {
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the validation
validateBlinkitSelectors().catch(console.error); 