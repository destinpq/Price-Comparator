import { NextRequest, NextResponse } from 'next/server';
import { saveToDb } from '@/lib/db/save-results';
import { scrapeAllPlatforms } from '@/lib/scrapers';

// Force dynamic generation for this route
export const dynamic = 'force-dynamic';

/**
 * GET handler for fetching prices
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const item = searchParams.get('item');
  const pincode = searchParams.get('pincode');

  // Validate parameters
  if (!item || !pincode) {
    return NextResponse.json({ error: 'Missing required parameters: item and pincode' }, { status: 400 });
  }

  console.log(`[API] Fetching prices for "${item}" in ${pincode} using real-time scrapers`);

  try {
    // Fetch real data from scrapers
    const scrapedData = await scrapeAllPlatforms(item, pincode);
    
    // Log detailed results for debugging
    console.log(`[API] Got ${scrapedData.results.length} results for "${item}"`);
    scrapedData.results.forEach(result => {
      console.log(`[API] ${result.platform}: Found "${result.productTitle}" (${result.quantity || 'no quantity'}) - Price: ${result.price || 'N/A'}`);
      if (result.error) {
        console.log(`[API] ${result.platform} Error: ${result.error}`);
      }
    });
    
    // Save to database unless SKIP_DB_INIT is true
    if (process.env.SKIP_DB_INIT !== 'true') {
      await saveToDb({
        item,
        pincode,
        timestamp: scrapedData.timestamp,
        results: scrapedData.results
      });
    }

    // Return response
    return NextResponse.json({
      item,
      pincode,
      timestamp: scrapedData.timestamp,
      results: scrapedData.results,
      source: 'live_data'
    });

  } catch (error) {
    console.error('[API] Error fetching prices:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch prices',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { item, pincode } = body;
    
    if (!item || !pincode) {
      return NextResponse.json(
        { error: 'Missing required parameters: item and pincode' },
        { status: 400 }
      );
    }
    
    const results = await scrapeAllPlatforms(item, pincode);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape price data' },
      { status: 500 }
    );
  }
} 