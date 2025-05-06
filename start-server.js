// This is a wrapper script to fix the __dirname issue in ES modules
// It runs the server with the required Node.js flags

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Provide __dirname equivalent for ES modules
global.__dirname = dirname(fileURLToPath(import.meta.url));

// Execute the server with proper environment variables
const serverProcess = exec(
  'NODE_ENV=development NODE_OPTIONS="--no-warnings" tsx server/index.ts',
  { env: { ...process.env, NODE_ENV: 'development' } }
);

// Pipe output to parent process
serverProcess.stdout.pipe(process.stdout);
serverProcess.stderr.pipe(process.stderr);

// Handle clean exit
process.on('SIGINT', () => {
  serverProcess.kill('SIGINT');
  process.exit(0);
});