import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { Express } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { pool } from "./db";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { User, insertUserSchema } from "@shared/schema";

const scryptAsync = promisify(scrypt);
const PostgresSessionStore = connectPg(session);

declare global {
  namespace Express {
    interface User extends User {}
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
  // Set up session middleware
  const sessionOptions: session.SessionOptions = {
    store: new PostgresSessionStore({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'collegeconnect-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    }
  };

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
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
      if (!user) {
        return res.status(401).json({ error: info.message || "Invalid email or password" });
      }
      
      // Log the user in
      req.login(user, (err) => {
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
    req.logout((err) => {
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
  
  // Auth check middleware
  app.use("/api/protected/*", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    next();
  });
}