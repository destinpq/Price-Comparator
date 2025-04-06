import { NextRequest, NextResponse } from 'next/server';
import db from '../../../lib/db';

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

    // Try to fetch from database first
    const dbResults = await db.query(
      'SELECT * FROM price_history WHERE item_name = $1 AND pincode = $2 AND timestamp > NOW() - INTERVAL \'1 hour\' ORDER BY timestamp DESC LIMIT 1',
      [item, pincode]
    );

    // If we have recent results, return them
    if (dbResults.rows.length > 0) {
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
      }));

      return NextResponse.json({
        item,
        pincode,
        timestamp: platforms.rows[0]?.timestamp || new Date().toISOString(),
        results,
      });
    }

    // Otherwise, generate mock data
    const timestamp = new Date().toISOString();
    const results = generateMockResults(item);

    // Save to database
    for (const result of results) {
      const price = result.price ? parseFloat(result.price.replace('₹', '')) : null;
      
      await db.query(
        'INSERT INTO price_history (item_name, pincode, platform, price, available, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
        [item, pincode, result.platform, price, result.available, timestamp]
      );
    }

    return NextResponse.json({
      item,
      pincode,
      timestamp,
      results,
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
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
    };
  });
}

// Generate a random delivery ETA
function getRandomDeliveryEta() {
  const options = ['10 mins', '15 mins', '30 mins', '1 hour', '2 hours', 'Tomorrow'];
  return options[Math.floor(Math.random() * options.length)];
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
    
    // Customize mock data with the requested item name
    const customData = {
      ...mockData,
      results: mockData.results.map(result => ({
        ...result,
        productTitle: `${item} (Demo)`,
      }))
    };
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return NextResponse.json(customData);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 