# Grocery Price Comparison Backend

This is a Next.js backend service that scrapes grocery prices from multiple platforms (Blinkit, Zepto, D-Mart, and Instamart) and provides a unified API for comparing prices.

## Features

- Scrapes real-time prices from Blinkit, Zepto, D-Mart Ready, and Swiggy Instamart
- Provides an HTTP API for querying prices by item and pincode
- Demo web interface to test the API
- Mock API for development and testing

## Tech Stack

- Next.js (API Routes)
- TypeScript
- Playwright for web scraping
- React for demo UI

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:

```bash
npm install
```

3. Install Playwright browsers:

```bash
npx playwright install chromium
```

4. Run the development server:

```bash
npm run dev
```

The server will start at [http://localhost:3000](http://localhost:3000).

## API Usage

### GET /api/get-prices

Fetches prices for a specific item across all supported grocery platforms.

**Query Parameters:**

- `item` (required): The grocery item to search for
- `pincode` (required): The delivery pincode/area

**Example Request:**

```
GET /api/get-prices?item=milk&pincode=110001
```

**Example Response:**

```json
{
  "results": [
    {
      "platform": "Blinkit",
      "productTitle": "Amul Toned Milk 500ml",
      "price": "₹30",
      "available": true,
      "deliveryEta": "10 mins",
      "imageUrl": "https://example.com/image.jpg"
    },
    {
      "platform": "Zepto",
      "productTitle": "Amul Toned Milk 500ml",
      "price": "₹32",
      "available": true,
      "deliveryEta": "8 mins",
      "imageUrl": "https://example.com/image.jpg"
    },
    // Other platforms...
  ],
  "timestamp": "2023-06-10T12:34:56.789Z"
}
```

### POST /api/get-prices

Same as GET but accepts JSON body instead of query parameters.

**Request Body:**

```json
{
  "item": "milk",
  "pincode": "110001"
}
```

### Mock API

For development purposes, a mock API is available at `/api/mock-prices` with the same interface as the real API. It returns predefined data without running the web scrapers.

To toggle between the real API and mock API in the demo UI, change the `USE_MOCK_API` constant in `src/app/page.tsx`.

## Demo UI

A simple demo UI is available at the root URL (/) to test the API without writing code. Enter an item and pincode to see the comparison results.

## Deployment

To deploy this application, you can use the provided deployment script:

```bash
./deploy.sh
```

### Vercel Deployment

When deploying to Vercel, make sure to set the `PLAYWRIGHT_BROWSERS_PATH` environment variable to `0` in your Vercel project settings.

## Notes

- Scraping is performed in real-time, so the API response may take a few seconds
- The scrapers might need maintenance if the grocery platform websites change their structure
- This is for educational purposes only - check the Terms of Service of each platform before using in production

## License

MIT
