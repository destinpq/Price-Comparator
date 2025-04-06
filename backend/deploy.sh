#!/bin/bash

# Deployment script for the grocery price comparison backend

# Install dependencies
echo "Installing dependencies..."
npm install

# Install Playwright browsers (headless Chrome)
echo "Installing Playwright browsers..."
npx playwright install chromium --with-deps

# Build the application
echo "Building the application..."
npm run build

# Start the server (for standalone deployments)
# npm start

# For Vercel deployment, just push to your GitHub repository
# and connect it to Vercel
echo "Deployment preparation complete!"
echo "For Vercel deployment:"
echo "1. Push your code to GitHub"
echo "2. Connect your repository to Vercel"
echo "3. Set the PLAYWRIGHT_BROWSERS_PATH environment variable to 0 in Vercel"
echo "4. Deploy!" 