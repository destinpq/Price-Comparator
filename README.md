# Grocery Price Comparison App

A comprehensive solution for comparing grocery prices across multiple platforms (Blinkit, Zepto, D-Mart, and Instamart).

## Project Structure

This repository contains two main components:

### 1. Backend (Next.js)

The `backend` directory contains a Next.js application that:
- Scrapes real-time prices from grocery platforms
- Provides API endpoints for querying prices
- Includes a mock API for development
- Offers a simple web UI for testing

### 2. Mobile App (Flutter)

The `price_comparator_app` directory contains a Flutter application that:
- Connects to the backend API
- Allows searching for grocery items by name and pincode
- Displays price comparisons from multiple platforms
- Supports saving searches for future reference

## Setup Instructions

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Flutter App Setup

```bash
cd price_comparator_app
flutter pub get
flutter run
```

For more detailed setup instructions, refer to the README files in each directory.

## Technologies Used

- **Backend**: Next.js, TypeScript, Playwright (for web scraping)
- **Mobile App**: Flutter, Dart, Riverpod (state management)

## License

MIT 