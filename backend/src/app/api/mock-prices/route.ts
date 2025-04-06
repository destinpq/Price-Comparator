import { NextRequest, NextResponse } from 'next/server';
import db from '../../../lib/db';
import { QueryResult } from 'pg';

// Force dynamic generation for this route
export const dynamic = 'force-dynamic';

// This is a mock API endpoint to simulate fetching prices from multiple sources
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const item = searchParams.get('item');
    const pincode = searchParams.get('pincode');

    // Validate parameters
    if (!item || !pincode) {
      return NextResponse.json(
        { error: 'Item and pincode parameters are required' },
        { status: 400 }
      );
    }

    // Set flag for whether we're using a real DB or not
    const usingMockDB = process.env.SKIP_DB_INIT === 'true';
    
    let resultsFromDB = false;
    let dbResults: QueryResult<any> = { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    
    // Only try to fetch from database if we're not using mock DB
    if (!usingMockDB) {
      try {
        // Try to fetch from database first
        dbResults = await db.query(
          'SELECT * FROM price_history WHERE item_name = $1 AND pincode = $2 AND timestamp > NOW() - INTERVAL \'1 hour\' ORDER BY timestamp DESC LIMIT 1',
          [item, pincode]
        );
        resultsFromDB = dbResults.rows.length > 0;
      } catch (dbError) {
        console.warn('Database query failed:', dbError);
        console.log('Falling back to generated mock data');
      }
    }

    // If we have recent results, return them
    if (resultsFromDB) {
      try {
        // Format the results before returning
        const platforms = await db.query(
          'SELECT platform, price, available, timestamp FROM price_history WHERE item_name = $1 AND pincode = $2 AND timestamp = (SELECT MAX(timestamp) FROM price_history WHERE item_name = $1 AND pincode = $2)',
          [item, pincode]
        );

        const results = platforms.rows.map((row) => ({
          platform: row.platform,
          price: row.price ? `₹${row.price}` : null,
          available: row.available,
          deliveryEta: row.available ? getRandomDeliveryEta() : null,
          productTitle: `${item} (${row.platform})`,
          imageUrl: getImageUrlForPlatform(row.platform),
        }));

        return NextResponse.json({
          item,
          pincode,
          timestamp: platforms.rows[0]?.timestamp || new Date().toISOString(),
          results,
        });
      } catch (formatError) {
        console.warn('Error formatting database results:', formatError);
        console.log('Falling back to generated mock data');
      }
    }

    // Otherwise, generate mock data
    const timestamp = new Date().toISOString();
    const results = generateMockResults(item);

    // Save to database only if we're not in mock mode
    if (!usingMockDB) {
      try {
        for (const result of results) {
          const price = result.price ? parseFloat(result.price.replace('₹', '')) : null;
          
          await db.query(
            'INSERT INTO price_history (item_name, pincode, platform, price, available, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
            [item, pincode, result.platform, price, result.available, timestamp]
          );
        }
      } catch (saveError) {
        console.warn('Error saving results to database:', saveError);
        // Continue anyway as we still have the mock results to return
      }
    }

    return NextResponse.json({
      item,
      pincode,
      timestamp,
      results,
      source: usingMockDB ? 'mock_database' : 'generated'
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    
    // Generate emergency mock data
    const timestamp = new Date().toISOString();
    // In case of error, we need to specify fallback values
    const fallbackItem = 'unknown item';
    const fallbackPincode = 'unknown';
    const results = generateMockResults(fallbackItem);
    
    return NextResponse.json({
      item: fallbackItem,
      pincode: fallbackPincode,
      timestamp,
      results,
      source: 'emergency_fallback'
    });
  }
}

// Function to generate mock results
function generateMockResults(item: string) {
  const platforms = ['Blinkit', 'Zepto', 'D-Mart', 'Instamart'];
  
  return platforms.map(platform => {
    // Simulate some platforms not having the item
    const available = Math.random() > 0.2;
    
    // Generate a price between ₹50 and ₹500
    const price = available ? `₹${(50 + Math.random() * 450).toFixed(2)}` : null;
    
    return {
      platform,
      price,
      available,
      deliveryEta: available ? getRandomDeliveryEta() : null,
      productTitle: `${item} (${platform})`,
      imageUrl: getImageUrlForPlatform(platform),
    };
  });
}

// Generate a random delivery ETA
function getRandomDeliveryEta() {
  const options = ['10 mins', '15 mins', '30 mins', '1 hour', '2 hours', 'Tomorrow'];
  return options[Math.floor(Math.random() * options.length)];
}

// Get image URL based on platform
function getImageUrlForPlatform(platform: string) {
  switch (platform) {
    case 'Blinkit':
      return 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=250,h=250/app/images/products/sliding_image/391306a.jpg';
    case 'Zepto':
      return 'https://ik.imagekit.io/zst/products/tr:n-ik_ml_v1/57361103.jpg';
    case 'D-Mart':
      return 'https://www.dmartindia.com/images/product/large/DP0000002139.jpg';
    case 'Instamart':
      return 'https://cdn.swiggy.com/image/upload/fl_lossy,f_auto,q_auto,w_300,h_300/rng/md/carousel/production/z3mg2rhkw8knfhyifp2s';
    default:
      return null;
  }
}

// POST method implementation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { item, pincode } = body;

    // Validate parameters
    if (!item || !pincode) {
      return NextResponse.json(
        { error: 'Item and pincode parameters are required' },
        { status: 400 }
      );
    }

    // Generate mock data for the POST request
    const timestamp = new Date().toISOString();
    const results = generateMockResults(item);

    // Set flag for whether we're using a real DB or not
    const usingMockDB = process.env.SKIP_DB_INIT === 'true';
    
    // Save to database only if not using mock DB
    if (!usingMockDB) {
      try {
        for (const result of results) {
          const price = result.price ? parseFloat(result.price.replace('₹', '')) : null;
          
          await db.query(
            'INSERT INTO price_history (item_name, pincode, platform, price, available, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
            [item, pincode, result.platform, price, result.available, timestamp]
          );
        }
      } catch (saveError) {
        console.warn('Error saving results to database:', saveError);
        // Continue anyway as we still have the mock results to return
      }
    }

    return NextResponse.json({
      item,
      pincode,
      timestamp,
      results,
      source: usingMockDB ? 'mock_database' : 'saved'
    });
  } catch (error) {
    console.error('Error processing POST request:', error);
    
    // Generate emergency mock data
    const timestamp = new Date().toISOString();
    let item, pincode;
    
    try {
      const body = await request.json();
      item = body.item;
      pincode = body.pincode;
    } catch {
      item = 'unknown item';
      pincode = 'unknown';
    }
    
    const results = generateMockResults(item || 'unknown item');
    
    return NextResponse.json({
      item: item || 'unknown item',
      pincode: pincode || 'unknown',
      timestamp,
      results,
      source: 'emergency_fallback'
    });
  }
} 