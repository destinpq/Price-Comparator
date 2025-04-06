#!/bin/bash

# Exit on error
set -e

# Function to sanitize environment variables
sanitize_env() {
  for var in DB_USERNAME DB_PASSWORD DB_HOST DB_PORT DB_DATABASE DB_SSL_MODE API_PORT NODE_ENV; do
    if [ -n "${!var}" ]; then
      # Remove newlines and trailing spaces
      cleaned_value=$(echo "${!var}" | tr -d '\n' | tr -d '\r' | sed 's/ *$//')
      export "$var"="$cleaned_value"
      
      # Don't print password
      if [ "$var" = "DB_PASSWORD" ]; then
        echo "Sanitized $var=[HIDDEN]"
      else
        echo "Sanitized $var=$cleaned_value"
      fi
    fi
  done
}

# Check for required environment variables
if [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_DATABASE" ]; then
  echo "Loading environment variables from .env file..."
  if [ -f ".env" ]; then
    # Use grep to extract variables without evaluation/expansion
    # And manually export them
    while IFS= read -r line; do
      # Skip comments and empty lines
      if [ -n "$line" ] && [[ ! "$line" =~ ^# ]]; then
        # Extract variable name and value
        var=$(echo "$line" | cut -d '=' -f 1)
        val=$(echo "$line" | cut -d '=' -f 2-)
        # Export the variable
        export "$var"="$val"
        echo "Loaded $var from .env file"
      fi
    done < .env
    
    # Sanitize loaded variables
    sanitize_env
  else
    echo "ERROR: .env file not found and environment variables not set"
    exit 1
  fi
else
  echo "Using environment variables from system"
  sanitize_env
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