import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import dotenv from 'dotenv';
import { resolve } from 'path';
import initDatabase from './lib/db/init-db';
import fs from 'fs';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
console.log(`Checking for .env file at: ${envPath}`);

try {
  if (fs.existsSync(envPath)) {
    console.log('.env file found, loading environment variables...');
    const envConfig = dotenv.config({ path: envPath });
    
    if (envConfig.error) {
      console.error('Error loading .env file:', envConfig.error);
    } else {
      console.log('.env file loaded successfully');
    }
    
    // Debug: Print environment variables (safely)
    console.log('\nEnvironment variables after loading .env:');
    const requiredVars = ['DB_USERNAME', 'DB_HOST', 'DB_DATABASE', 'DB_PORT', 'DB_SSL_MODE'];
    let missingVars: string[] = [];
    
    requiredVars.forEach(key => {
      const value = process.env[key];
      if (!value) {
        console.error(`WARNING: Missing required environment variable: ${key}`);
        missingVars.push(key);
      } else {
        // Only print first few characters of sensitive variables
        if (key === 'DB_PASSWORD') {
          console.log(`${key}=******** (hidden for security)`);
        } else {
          // For hostnames and other values, make sure they're properly trimmed
          if (value.includes('\n')) {
            console.error(`WARNING: Environment variable ${key} contains newlines!`);
            console.log(`${key}=${value.split('\n')[0]} (truncated, contained newlines)`);
          } else {
            console.log(`${key}=${value}`);
          }
        }
      }
    });
    
    if (missingVars.length > 0) {
      console.error(`ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
    }
  } else {
    console.log('.env file not found, will use system environment variables');
    
    // Also check system environment variables
    const requiredVars = ['DB_USERNAME', 'DB_HOST', 'DB_DATABASE', 'DB_PORT'];
    const missingVars: string[] = requiredVars.filter(key => !process.env[key]);
    
    if (missingVars.length > 0) {
      console.error(`ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }
} catch (error) {
  console.error('Error processing environment variables:', error);
}

// Log important environment variables (masking sensitive data)
console.log('\nEnvironment variables loaded:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`API_PORT: ${process.env.API_PORT}`);

const dbHost = process.env.DB_HOST?.trim();
if (dbHost) {
  console.log(`DB_HOST: ${dbHost.split('.')[0]}... (truncated)`);
} else {
  console.error('WARNING: DB_HOST is not defined!');
}

console.log(`DB_DATABASE: ${process.env.DB_DATABASE}`);
console.log(`DB_SSL_MODE: ${process.env.DB_SSL_MODE}`);

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.API_PORT || '3000', 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  try {
    // Initialize the database
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialized successfully');

    // Create the HTTP server
    createServer(async (req, res) => {
      try {
        // Parse the request URL
        const parsedUrl = parse(req.url || '', true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error handling request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }).listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Environment: ${process.env.NODE_ENV}`);
      if (dbHost) {
        console.log(`> Database: ${dbHost.split('.')[0]}... (truncated)`);
      } else {
        console.log('> Database: Not configured');
      }
    });
  } catch (err) {
    console.error('Error starting server:', err);
    console.error('Details:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}); 