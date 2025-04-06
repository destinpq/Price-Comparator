import { readFileSync } from 'fs';
import { join } from 'path';
import db from './index';

/**
 * Initialize the database by running the schema SQL
 */
async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Read the schema file
    const schemaPath = join(__dirname, 'schema.sql');
    console.log(`Reading schema file from: ${schemaPath}`);
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    console.log('Executing database schema...');
    await db.query(schema);
    
    // Verify database setup by querying a table
    try {
      const tableCheck = await db.query('SELECT COUNT(*) FROM users');
      console.log(`Database initialized successfully with ${tableCheck.rows[0].count} users`);
    } catch (tableError) {
      console.warn('Database initialized but could not verify tables:', tableError instanceof Error ? tableError.message : String(tableError));
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing database:');
    console.error(error instanceof Error ? error.message : String(error));
    
    // In development, we might want to continue even if DB init fails
    if (process.env.NODE_ENV === 'production') {
      throw error; // Re-throw in production to fail startup
    } else {
      console.warn('Continuing despite database initialization failure (non-production environment)');
      return false;
    }
  }
}

// Run the initialization if this file is executed directly
if (require.main === module) {
  initDatabase()
    .then(success => {
      if (success) {
        console.log('Database initialization completed successfully');
        process.exit(0);
      } else {
        console.error('Database initialization completed with errors');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}

export default initDatabase; 