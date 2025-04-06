import { NextRequest, NextResponse } from 'next/server';

// Mock data that will be returned for any query
const mockData = {
  results: [
    {
      platform: 'Blinkit',
      productTitle: 'Amul Toned Milk 500ml',
      price: '₹30',
      available: true,
      deliveryEta: '10-15 mins',
      imageUrl: 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=85,metadata=none,w=250,h=250/app/images/products/sliding_image/391306a.jpg'
    },
    {
      platform: 'Zepto',
      productTitle: 'Amul Toned Milk 500ml',
      price: '₹32',
      available: true,
      deliveryEta: '8-12 mins',
      imageUrl: 'https://ik.imagekit.io/zst/products/tr:n-ik_ml_v1/57361103.jpg'
    },
    {
      platform: 'D-Mart Ready',
      productTitle: 'Amul Toned Milk 500ml',
      price: '₹29',
      available: true,
      deliveryEta: '2-3 hours',
      imageUrl: 'https://www.dmartindia.com/images/product/large/DP0000002139.jpg'
    },
    {
      platform: 'Swiggy Instamart',
      productTitle: 'Amul Toned Milk 500ml',
      price: '₹31',
      available: true,
      deliveryEta: '15-20 mins',
      imageUrl: 'https://cdn.swiggy.com/image/upload/fl_lossy,f_auto,q_auto,w_300,h_300/rng/md/carousel/production/z3mg2rhkw8knfhyifp2s'
    }
  ],
  timestamp: new Date().toISOString()
};

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