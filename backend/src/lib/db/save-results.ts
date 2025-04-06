import db from './index';
import { ScraperResult } from '../scrapers';

interface SaveToDbParams {
  item: string;
  pincode: string;
  timestamp: string;
  results: ScraperResult[];
}

/**
 * Save price comparison results to the database
 */
export async function saveToDb({ item, pincode, timestamp, results }: SaveToDbParams): Promise<void> {
  try {
    for (const result of results) {
      // Extract numeric price from string (e.g., "₹149" -> 149)
      let numericPrice: number | null = null;
      
      if (result.price) {
        // Remove currency symbol and commas, then parse
        const priceString = result.price.replace(/[₹,]/g, '').trim();
        const parsedPrice = parseFloat(priceString);
        
        if (!isNaN(parsedPrice)) {
          numericPrice = parsedPrice;
        }
      }
      
      await db.query(
        'INSERT INTO price_history (item_name, pincode, platform, price, available, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
        [item, pincode, result.platform, numericPrice, result.available, timestamp]
      );
    }
    
    console.log(`Saved ${results.length} results for "${item}" in ${pincode} to database`);
  } catch (error) {
    console.error('Error saving results to database:', error);
    // Don't throw the error - we still want to return results even if DB save fails
  }
} 