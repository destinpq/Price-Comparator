# Grocery Price Comparator

A mobile app to compare grocery prices across multiple Indian platforms including Blinkit, Zepto, D-Mart, and Instamart.

## Features

- Search for grocery items by name
- Enter pincode to get local prices
- Compare prices across multiple platforms
- Save your favorite searches for quick access
- Detailed information including delivery ETA and availability

## Backend Service

This app connects to a backend service that provides price comparison data. The backend is currently hosted at:

```
https://hammerhead-app-wafj8.ondigitalocean.app
```

You can test the API directly in your browser by visiting:
```
https://hammerhead-app-wafj8.ondigitalocean.app/api/mock-prices?item=milk&pincode=400001
```

### Local Development

To connect to a local development server:

1. Make sure your backend server is running on your machine
2. Find your computer's local IP address using `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Update the `developmentUrl` variable in `lib/services/api_service.dart` with your IP:
```dart
static const String developmentUrl = 'http://YOUR_IP_ADDRESS:3000';
```
4. Make sure `useDevServer` is set to `true`:
```dart
static final bool useDevServer = true;
```
5. Run the app on a device connected to the same network

## Getting Started

### Prerequisites

- Flutter SDK (2.0 or higher)
- Android Studio / Xcode
- An Android or iOS device (or emulator)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/destinpq/Price-Comparator.git
cd Price-Comparator/price_comparator_app
```

2. Install dependencies:
```bash
flutter pub get
```

3. Run the app:
```bash
flutter run
```

## Usage

1. On the home screen, enter a grocery item name (e.g., milk, bread, eggs)
2. Enter a valid 6-digit Indian pincode (e.g., 400001 for Mumbai)
3. Tap "Compare Prices"
4. View the comparison results from multiple platforms
5. Save searches you want to reuse later

## Troubleshooting

If you encounter connection issues:
- Ensure you have a working internet connection
- Try refreshing the data using the refresh button
- Check if the backend service is operational by visiting the test URL in a browser
- When using a local development server, make sure:
  - Your device is on the same network as your computer
  - You've used the correct IP address
  - The port (default 3000) is not blocked by your firewall
  - You've set `useDevServer = true` in the API service

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT
