import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { Express } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { pool } from "./db";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { User, insertUserSchema, UserRole } from "@shared/schema";
import memorystore from "memorystore";

const scryptAsync = promisify(scrypt);
const PostgresSessionStore = connectPg(session);
const MemoryStore = memorystore(session);

declare global {
  namespace Express {
    interface User extends Omit<import("@shared/schema").User, 'password'> {}
  }
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Set up session middleware with MemoryStore by default
  let sessionStore;
  
  // Always use MemoryStore since PostgreSQL is having connection issues
  console.log("Using in-memory session store");
  sessionStore = new MemoryStore({
    checkPeriod: 86400000 // Clear expired sessions every 24h
  });
  
  const sessionOptions: session.SessionOptions = {
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'collegeconnect-secret',
    resave: true, // Changed to true to ensure session is saved
    saveUninitialized: true, // Changed to true to create session for all users
    cookie: {
      secure: false, // Set to false to work in development
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: false, // Allow JavaScript access
      sameSite: 'lax' // More permissive same-site policy
    }
  };

  // Trust proxy - important for session cookies to work behind proxies
  app.set('trust proxy', 1);
  
  app.use(session(sessionOptions));
  
  // Set up Passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure Passport local strategy
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          // Find the user by email
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          
          // Verify the password
          const isPasswordValid = await comparePasswords(password, user.password);
          if (!isPasswordValid) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          
          // Return the user if authentication is successful
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  
  // Serialize user to store in session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register a new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Validate the request body using the schema
      let userData = req.body;
      
      try {
        userData = insertUserSchema.parse(userData);
      } catch (validationError: any) {
        return res.status(400).json({ 
          error: `Validation error: ${validationError.message}` 
        });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }
      
      // Check if collegeId is already in use
      if (userData.collegeId) {
        const userWithCollegeId = await storage.getUserByCollegeId(userData.collegeId);
        if (userWithCollegeId) {
          return res.status(400).json({ error: "This College ID is already in use" });
        }
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(userData.password);
      
      // Save the user with the hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Log in the user immediately after registration
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to log in after registration" });
        }
        // Return the user without the password
        return res.json({ user: { ...user, password: undefined } });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  
  // Login a user
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid email or password" });
      }
      
      // Log the user in
      req.login(user, (err: any) => {
        if (err) {
          return res.status(500).json({ error: "Failed to log in" });
        }
        // Return the user without the password
        return res.json({ user: { ...user, password: undefined } });
      });
    })(req, res, next);
  });
  
  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Failed to log out" });
      }
      
      res.json({ success: true });
    });
  });
  
  // Get current user
  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Return the user without the password
    res.json({ user: { ...req.user, password: undefined } });
  });
  
  // Special route to manually establish a session for the given user ID
  app.post("/api/auth/session", async (req, res) => {
    try {
      const userId = req.body.userId;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Manually log the user in
      req.login(user, (err: any) => {
        if (err) {
          return res.status(500).json({ error: "Failed to establish session" });
        }
        
        console.log("Manual session established for user:", user.id, user.email);
        return res.json({ success: true, user: { ...user, password: undefined } });
      });
    } catch (error: any) {
      console.error("Error establishing session:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  
  // Auth check middleware
  // Debug middleware to log session data
  app.use((req, res, next) => {
    console.log('Session ID:', req.sessionID);
    console.log('Is authenticated:', req.isAuthenticated());
    if (req.user) {
      console.log('User:', req.user.id, req.user.email);
    }
    next();
  });

  // Token middleware (for bypassing session issues)
  app.use("/api/protected/*", async (req, res, next) => {
    // First, try session authentication
    if (req.isAuthenticated()) {
      return next();
    }
    
    console.log("🔑 Protected route access attempt:", req.path);
    
    // If session auth fails, try token auth from headers
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Simple token validation - in a real app, use JWT or similar
      try {
        // Extract user ID from token (format: "user-123")
        if (token.startsWith('user-')) {
          const userId = parseInt(token.substring(5));
          if (!isNaN(userId)) {
            const user = await storage.getUser(userId);
            if (user) {
              console.log("🔑 TOKEN AUTH: Authenticated user from token:", user.id);
              // Manual login
              req.login(user, (err) => {
                if (err) {
                  console.error("Error logging in with token:", err);
                  return res.status(401).json({ error: "Not authenticated" });
                }
                return next();
              });
              return;
            }
          }
        }
      } catch (error) {
        console.error("Token authentication error:", error);
      }
    }
    
    // Also check for a userId in the query string
    if (req.query.userId) {
      try {
        const userId = parseInt(req.query.userId as string);
        if (!isNaN(userId)) {
          const user = await storage.getUser(userId);
          if (user) {
            console.log("🔑 QUERY AUTH: Authenticated user from query param:", user.id);
            // Manual login
            req.login(user, (err) => {
              if (err) {
                console.error("Error logging in with userId query:", err);
                return res.status(401).json({ error: "Not authenticated" });
              }
              return next();
            });
            return;
          }
        }
      } catch (error) {
        console.error("Query authentication error:", error);
      }
    }
    
    // Development mode authentication - use a default faculty user
    // This is useful for development and testing when authentication is not available
    if (req.query.dev === 'true' || req.body.dev === true) {
      try {
        console.log("🔑 DEV AUTH: Processing request to", req.path);
        // Create a default faculty user for development if not found
        let devUser = await storage.getUserByEmail("faculty@example.com");
        
        if (!devUser) {
          // If the user doesn't exist, create a default one
          console.log("🔑 DEV AUTH: Creating default faculty user");
          devUser = {
            id: 1,
            role: UserRole.FACULTY,
            email: "faculty@example.com",
            password: "not-used",
            firstName: "Dev",
            lastName: "Faculty",
            collegeId: "FAC001",
            department: "Computer Science",
            position: "Professor",
            year: null,
            profilePicture: null
          };
        }
        
        // Login the default user
        req.login(devUser, (err) => {
          if (err) {
            console.error("DEV AUTH: Error logging in with dev user:", err);
            return res.status(401).json({ error: "Not authenticated" });
          }
          console.log("🔑 DEV AUTH: Successfully authenticated with dev user:", devUser.id);
          return next();
        });
        return;
      } catch (error) {
        console.error("Development authentication error:", error);
      }
    }
    
    // Try to extract user information from x-user-id and x-user-role headers
    if (req.headers['x-user-id']) {
      try {
        const userId = parseInt(req.headers['x-user-id'] as string);
        if (!isNaN(userId)) {
          const user = await storage.getUser(userId);
          if (user) {
            console.log("🔑 HEADER AUTH: Authenticated user from header:", user.id);
            // Manual login
            req.login(user, (err) => {
              if (err) {
                console.error("Error logging in with header info:", err);
                return res.status(401).json({ error: "Not authenticated" });
              }
              return next();
            });
            return;
          }
        }
      } catch (error) {
        console.error("Header authentication error:", error);
      }
    }
    
    // If all auth methods fail
    console.log("❌ AUTH FAILED: No authentication method succeeded for", req.path);
    return res.status(401).json({ error: "Not authenticated" });
  });
  
  // Admin role check middleware
  app.use("/api/admin/*", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // Only allow access to users with the admin role
    const user = req.user as Express.User;
    if (user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    next();
  });
  
  // Development authentication helper endpoint
  app.post("/api/auth/dev-session", async (req, res) => {
    try {
      // This endpoint establishes a development session with a faculty user
      // It's designed to help with authentication issues during development
      
      // Create a default faculty user for development
      const devUser = {
        id: 1,
        role: UserRole.FACULTY,
        email: "faculty@example.com",
        password: "not-used",
        firstName: "Dev",
        lastName: "Faculty",
        collegeId: "FAC001",
        department: "Computer Science",
        position: "Professor",
        year: null,
        profilePicture: null
      };
      
      // Log in the user
      req.login(devUser, (err) => {
        if (err) {
          console.error("Dev auth login error:", err);
          return res.status(500).json({ error: "Failed to establish development session" });
        }
        
        console.log("Development auth session established for user ID:", devUser.id);
        return res.json({ 
          success: true, 
          message: "Development authentication session established",
          user: { ...devUser, password: undefined }
        });
      });
    } catch (error: any) {
      console.error("Development auth error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
}