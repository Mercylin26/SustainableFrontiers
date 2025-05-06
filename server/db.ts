import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Handle the case where DATABASE_URL might not be available
let pool;
let db;

try {
  if (!process.env.DATABASE_URL) {
    console.error("WARNING: DATABASE_URL not set. Database functionality will be limited.");
  } else {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000 // 5 second timeout
    });
    db = drizzle(pool, { schema });
    console.log("Database connection initialized successfully");
  }
} catch (error) {
  console.error("Failed to initialize database connection:", error);
  // Create a dummy pool and db for fallback functionality
  const dummyPool = {
    query: async () => { throw new Error("Database connection failed"); },
    connect: async () => { throw new Error("Database connection failed"); },
    end: async () => { console.log("Dummy pool end called"); },
  };
  pool = dummyPool as any;
  db = drizzle(dummyPool as any, { schema });
}

export { pool, db };