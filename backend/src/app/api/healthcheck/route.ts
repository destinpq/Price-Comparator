import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET() {
  try {
    // Check database connection
    const result = await db.query('SELECT NOW() as time');
    const dbTime = result.rows[0].time;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        time: dbTime,
        host: process.env.DB_HOST?.split('.')[0] || 'unknown', // Only show first part of host for security
      },
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error('Healthcheck failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown database error',
        },
        environment: process.env.NODE_ENV,
      },
      { status: 500 }
    );
  }
} 