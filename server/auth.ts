import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { Express } from "express";
import { storage } from "./storage";
import { User, insertUserSchema } from "@shared/schema";

const scryptAsync = promisify(scrypt);

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
      
      // Return the user without the password
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  
  // Login a user
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      // Find the user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Verify the password
      const isPasswordValid = await comparePasswords(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      // Return the user without the password
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
}