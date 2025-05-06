// DEVELOPMENT AUTHENTICATION WORKAROUND
// This file provides a development-only authentication bypass
// to fix the "User not authenticated" errors with faculty features

import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '@shared/schema';

// This middleware automatically authenticates requests to protected routes
export const devAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Log for debugging
  console.log("🔑 DEV AUTH: Processing request to", req.path);
  
  // Skip authentication for login/register routes
  if (req.path.includes('/login') || req.path.includes('/register')) {
    return next();
  }
  
  // Auto-authenticate all API routes with a default user
  // This ensures all features can be accessed during development
  
  // Create a default faculty user and attach to the request
  (req as any).user = {
    id: 1,
    role: UserRole.FACULTY,
    email: "faculty@example.com",
    firstName: "Default",
    lastName: "Faculty",
    department: "Computer Science",
    position: "Professor",
    profilePicture: "https://randomuser.me/api/portraits/men/1.jpg"
  };
  
  // Set request as authenticated
  (req as any).isAuthenticated = () => true;
  
  // Log for all protected routes
  if (req.path.startsWith('/api/protected/')) {
    console.log("🔐 DEV AUTH: Auto-authenticating for protected route");
  }
  
  // Continue processing the request
  next();
};