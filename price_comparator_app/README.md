# Price Comparator App

A Flutter app for comparing grocery prices across multiple online platforms including Blinkit, Zepto, D-Mart, and Swiggy Instamart.

## Features

- Search for grocery items by name
- Enter pincode for location-specific pricing
- View price comparison from multiple platforms
- See delivery times and availability
- Save searches for quick access
- Local storage using Hive

## Tech Stack

- Flutter
- Riverpod for state management
- Dio for API calls
- Hive for local storage
- Google Fonts for beautiful typography

## Screenshots

[Screenshots will be added here]

## Backend

This app connects to a Next.js backend that scrapes real-time prices from grocery platforms. The backend can be found in the `backend` directory.

## Setup

1. Ensure Flutter is installed on your machine
2. Clone the repository
3. Install dependencies:

```bash
flutter pub get
```

4. Start the backend server (see backend README)
5. Update the API URL in `lib/services/api_service.dart` if needed
6. Run the app:

```bash
flutter run
```

## API Configuration

The app is configured to connect to the backend server running locally. You may need to adjust the API endpoint in `lib/services/api_service.dart` based on your setup:

- For Android emulator: `http://10.0.2.2:3000`
- For iOS simulator: `http://localhost:3000`
- For physical devices: Use your computer's local IP address, e.g., `http://192.168.1.x:3000`
- For production: Use your deployed backend URL

## Usage

1. Enter a grocery item name (e.g., "milk", "bread", "rice")
2. Enter your pincode
3. Tap "Compare Prices" to see results
4. Save searches for future reference
5. Access saved searches from the bookmarks icon

## Development

This project uses code generation for Hive adapters:

```bash
flutter pub run build_runner build
```

## License

MIT
