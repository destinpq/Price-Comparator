import { NextRequest, NextResponse } from 'next/server';
import { scrapeAllPlatforms } from '@/lib/scrapers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const item = searchParams.get('item');
  const pincode = searchParams.get('pincode');
  
  if (!item || !pincode) {
    return NextResponse.json(
      { error: 'Missing required parameters: item and pincode' },
      { status: 400 }
    );
  }
  
  try {
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