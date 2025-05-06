// This is a wrapper to handle the __dirname issue in vite.config.ts
// It's a CommonJS file that loads the Vite config

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'vite';

// Create the __dirname variable that's missing in ES modules
global.__dirname = dirname(fileURLToPath(import.meta.url));

// Now we can import the vite config which uses __dirname
async function startServer() {
  try {
    const server = await createServer({
      // Base configuration
      configFile: './vite.config.ts',
      server: {
        port: 5000,
        host: '0.0.0.0',
      },
    });
    
    await server.listen();
    server.printUrls();
  } catch (e) {
    console.error('Error starting Vite server:', e);
    process.exit(1);
  }
}

startServer();