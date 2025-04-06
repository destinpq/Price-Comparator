
  import { scrapeBlinkit } from './src/lib/scrapers/blinkit';
  
  async function testScraper() {
    console.log("Starting test for Blinkit scraper...");
    console.log("Searching for: milk in 500034");
    
    try {
      const result = await scrapeBlinkit("milk", "500034");
      console.log("SCRAPER_RESULT:" + JSON.stringify(result, null, 2));
    } catch (error) {
      console.error("SCRAPER_ERROR:" + error.message);
    }
  }
  
  testScraper();
  