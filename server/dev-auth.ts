// DEV AUTHENTICATION MIDDLEWARE
// This file is only for development purposes to bypass authentication issues
// In production, you would use proper authentication mechanisms

import { Request, Response, NextFunction } from 'express';

export const devAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // We'll skip the session check and just use headers/query params
  // or auto-authenticate for protected routes
  
  // Try to get user info from headers or query params
  const userId = req.headers['x-user-id'] || req.query.userId;
  const userRole = req.headers['x-user-role'] || req.query.userRole || 'faculty';
  const currentUserStr = req.headers['x-current-user'] || req.query.currentUser;
  
  console.log("📝 Auth Headers:", { 
    userId, 
    userRole,
    'x-current-user': req.headers['x-current-user'] ? 'present' : 'missing'
  });
  
  // If userId provided, create a minimal user
  if (userId) {
    console.log("✅ Using userId for authentication:", userId);
    (req as any).user = { 
      id: Number(userId),
      role: userRole
    };
    return next();
  }
  
  // If currentUser provided, parse and use it
  if (currentUserStr) {
    try {
      const currentUser = JSON.parse(typeof currentUserStr === 'string' ? currentUserStr : '{}');
      if (currentUser && currentUser.id) {
        console.log("✅ Using currentUser for authentication:", currentUser.id);
        (req as any).user = currentUser;
        return next();
      }
    } catch (e) {
      console.error("❌ Error parsing currentUser:", e);
    }
  }
  
  // In development mode, use a default faculty user for /api/protected/* routes
  if (req.path.startsWith('/api/protected/')) {
    console.log("⚠️ DEV MODE: Auto-authenticating for protected route:", req.path);
    // For testing, create a faculty user with ID 1
    (req as any).user = { 
      id: 1, 
      role: "faculty",
      email: "faculty@example.com",
      firstName: "Dev",
      lastName: "Faculty"
    };
    return next();
  }
  
  // Continue without authentication for non-protected routes
  next();
};