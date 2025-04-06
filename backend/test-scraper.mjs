#!/usr/bin/env node

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to run a next.js script with TypeScript support
async function runNextScript(script) {
  try {
    console.log(`Running: ${script}`);
    const { stdout, stderr } = await execAsync(`npx next telemetry status`);
    console.log(`stdout: ${stdout}`);
    if (stderr) console.error(`stderr: ${stderr}`);
    return stdout;
  } catch (e) {
    console.error(`Error running script: ${e}`);
    throw e;
  }
}

async function main() {
  try {
    console.log('Starting Next.js development server for testing...');
    await execAsync('npm run dev');
  } catch (e) {
    console.error('Failed to start dev server:', e);
  }
}

main(); 