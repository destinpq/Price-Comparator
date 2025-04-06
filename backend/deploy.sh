#!/bin/bash

# Exit on error
set -e

# Check for required environment variables
if [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_DATABASE" ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
fi

# Display configuration (mask password)
echo "Deploying with configuration:"
echo "Database: $DB_HOST:$DB_PORT/$DB_DATABASE"
echo "User: $DB_USERNAME"
echo "SSL Mode: $DB_SSL_MODE"
echo "Environment: $NODE_ENV"
echo "Port: $API_PORT"

# Install dependencies
echo "Installing dependencies..."
npm ci

# Install Playwright browsers (headless Chrome)
echo "Installing Playwright browsers..."
npx playwright install chromium --with-deps

# Build the application
echo "Building application..."
npm run build

# Initialize the database
echo "Initializing database..."
npm run init-db

# Start the application
echo "Starting application..."
npm run start:custom

# For Vercel deployment, just push to your GitHub repository
# and connect it to Vercel
echo "Deployment preparation complete!"
echo "For Vercel deployment:"
echo "1. Push your code to GitHub"
echo "2. Connect your repository to Vercel"
echo "3. Set the PLAYWRIGHT_BROWSERS_PATH environment variable to 0 in Vercel"
echo "4. Deploy!" 