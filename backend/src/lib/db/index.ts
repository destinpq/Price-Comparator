import { Pool, PoolClient, QueryResult } from 'pg';
import { promisify } from 'util';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import { resolve } from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

// Define parameter types for the query function
type QueryParams = string | number | boolean | null | undefined;

// Mock database for local development
const mockDB = {
  query: async (text: string, params?: QueryParams[]): Promise<QueryResult> => {
    console.log(`[MOCK DB] Query: ${text}`);
    console.log('[MOCK DB] Params:', params);
    
    // Return empty result set
    return {
      rows: [],
      rowCount: 0,
      command: '',
      oid: 0,
      fields: []
    } as QueryResult;
  },
  getClient: async (): Promise<any> => {
    console.log('[MOCK DB] Getting client (mock)');
    return {
      query: async (text: string, params?: QueryParams[]): Promise<QueryResult> => {
        console.log(`[MOCK DB] Client Query: ${text}`);
        return {
          rows: [],
          rowCount: 0,
          command: '',
          oid: 0,
          fields: []
        } as QueryResult;
      },
      release: () => {
        console.log('[MOCK DB] Releasing client (mock)');
      }
    };
  }
};

// Initialize database connection
async function initializeConnection() {
  try {
    // Load environment variables
    const envPath = resolve(process.cwd(), '.env');
    const devEnvPath = resolve(process.cwd(), '.env.development');
    
    if (fs.existsSync(devEnvPath) && process.env.NODE_ENV !== 'production') {
      console.log('Loading development configuration from .env.development file...');
      dotenv.config({ path: devEnvPath });
    } else if (fs.existsSync(envPath)) {
      console.log('Loading database configuration from .env file...');
      dotenv.config({ path: envPath });
    } else {
      console.log('No .env file found, using system environment variables...');
    }

    // Check if we should skip database initialization
    if (process.env.SKIP_DB_INIT === 'true') {
      console.log('SKIP_DB_INIT is set to true, using mock database');
      return null;
    }

    // Clean and validate environment variables
    const DB_USERNAME = process.env.DB_USERNAME?.trim();
    const DB_PASSWORD = process.env.DB_PASSWORD?.trim();
    const DB_HOST = process.env.DB_HOST?.trim();
    const DB_PORT_STR = process.env.DB_PORT?.trim();
    const DB_DATABASE = process.env.DB_DATABASE?.trim();
    const DB_SSL_MODE = process.env.DB_SSL_MODE?.trim();

    // Validate required connection parameters
    if (!DB_HOST) throw new Error('DB_HOST environment variable is required');
    if (!DB_USERNAME) throw new Error('DB_USERNAME environment variable is required');
    if (!DB_PASSWORD) throw new Error('DB_PASSWORD environment variable is required');
    if (!DB_DATABASE) throw new Error('DB_DATABASE environment variable is required');

    // Parse port with fallback
    const DB_PORT = DB_PORT_STR ? parseInt(DB_PORT_STR, 10) : 5432;
    if (isNaN(DB_PORT)) {
      throw new Error(`Invalid DB_PORT: "${DB_PORT_STR}" is not a valid number`);
    }

    // Diagnostic: verify DNS resolution
    try {
      console.log(`Checking DNS resolution for ${DB_HOST}...`);
      const { stdout } = await execAsync(`ping -c 1 ${DB_HOST}`);
      console.log(`DNS resolution successful: ${stdout.split('\n')[0]}`);
    } catch (error) {
      console.error(`DNS resolution failed for ${DB_HOST}:`, error);
      console.log('This may indicate network issues or incorrect hostname.');
    }

    // Log connection attempt
    console.log('Creating database connection pool with:');
    console.log(`- Host: ${DB_HOST}`);
    console.log(`- Database: ${DB_DATABASE}`);
    console.log(`- Port: ${DB_PORT}`);
    console.log(`- User: ${DB_USERNAME}`);
    console.log(`- SSL Mode: ${DB_SSL_MODE || 'disabled'}`);

    // Create connection pool
    const pool = new Pool({
      host: DB_HOST,
      database: DB_DATABASE,
      user: DB_USERNAME,
      password: DB_PASSWORD,
      port: DB_PORT,
      ssl: DB_SSL_MODE === 'require' ? {
        rejectUnauthorized: false, // Allow self-signed certificates
      } : undefined,
      // Add connection timeout
      connectionTimeoutMillis: 10000,
      // Add idle timeout
      idleTimeoutMillis: 30000,
    });

    // Add error handler to the pool
    pool.on('error', (err: Error, client: PoolClient) => {
      console.error('Unexpected error on idle client:', err);
    });

    // Test connection
    console.log('Testing database connection...');
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as time');
      const currentTime = result.rows[0].time;
      console.log(`Database connection successful! Server time: ${currentTime}`);
      return pool;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to initialize database connection:');
    if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
      console.error(`Stack trace: ${error.stack}`);
    } else {
      console.error(`Unknown error: ${error}`);
    }
    
    // In production, database errors are critical
    if (process.env.NODE_ENV === 'production') {
      console.error('Fatal error: Database connection failed in production');
      process.exit(1);
    }
    
    // Return null to indicate connection failure
    return null;
  }
}

// Initialize pool
let pool: Pool | null = null;

// Initialize the pool immediately
initializeConnection()
  .then((newPool) => {
    pool = newPool;
  })
  .catch((err) => {
    console.error('Failed to initialize pool:', err);
  });

// Export database interface with automatic reconnection or mock DB
export default {
  query: async (text: string, params?: QueryParams[]): Promise<QueryResult> => {
    // Check if we should use the mock database
    if (process.env.SKIP_DB_INIT === 'true') {
      return mockDB.query(text, params);
    }
    
    // If pool doesn't exist or had an error, try to reconnect
    if (!pool) {
      console.log('Attempting to reconnect to database...');
      pool = await initializeConnection();
      
      if (!pool) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Database connection failed in production environment');
        } else {
          console.log('Using mock database in development environment');
          return mockDB.query(text, params);
        }
      }
    }
    
    return pool.query(text, params);
  },
  getClient: async (): Promise<PoolClient> => {
    // Check if we should use the mock database
    if (process.env.SKIP_DB_INIT === 'true') {
      return mockDB.getClient() as unknown as PoolClient;
    }
    
    // If pool doesn't exist or had an error, try to reconnect
    if (!pool) {
      console.log('Attempting to reconnect to database...');
      pool = await initializeConnection();
      
      if (!pool) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Database connection failed in production environment');
        } else {
          console.log('Using mock database in development environment');
          return mockDB.getClient() as unknown as PoolClient;
        }
      }
    }
    
    return pool.connect();
  },
}; 