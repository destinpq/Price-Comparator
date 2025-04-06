import { NextResponse } from 'next/server';
import os from 'os';
import fs from 'fs';
import path from 'path';

// Read package.json version manually since TypeScript doesn't allow direct imports of JSON
function getPackageVersion(): string {
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    return packageJson.version || '1.0.0';
  } catch (error) {
    console.warn('Could not read package.json version:', error);
    return '1.0.0';
  }
}

export async function GET() {
  try {
    // Get system info that doesn't depend on the database
    const systemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      uptime: Math.floor(os.uptime()), // Server uptime in seconds
      memory: {
        total: Math.floor(os.totalmem() / (1024 * 1024)), // MB
        free: Math.floor(os.freemem() / (1024 * 1024)),   // MB
      },
      cpus: os.cpus().length,
      load: os.loadavg(),
    };

    // Collect application info
    const appInfo = {
      name: 'Price Comparator API',
      version: getPackageVersion(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      databaseEnabled: process.env.SKIP_DB_INIT !== 'true',
      startTime: new Date().toISOString(),
    };

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      app: appInfo,
      system: systemInfo,
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Healthcheck error:', error);
    
    // Even if there's an error, return a valid response with error info
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }
} 