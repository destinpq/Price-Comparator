import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create a connection pool
const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL_MODE === 'require' ? {
    rejectUnauthorized: false, // This allows self-signed certificates
  } : undefined,
});

// Test the connection
pool.query('SELECT NOW()', (err: Error | null, _res: QueryResult) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// Define parameter types for the query function
type QueryParams = string | number | boolean | null | undefined;

// Export the pool to be used in other modules
export default {
  query: (text: string, params?: QueryParams[]): Promise<QueryResult> => pool.query(text, params),
  getClient: () => pool.connect(),
}; 