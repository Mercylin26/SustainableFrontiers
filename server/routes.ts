import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { devAuthMiddleware } from "./dev-auth";
import { 
  insertUserSchema, 
  insertDepartmentSchema, 
  insertSubjectSchema,
  insertTimetableEntrySchema,
  insertAttendanceRecordSchema,
  insertEventSchema,
  insertNoteSchema,
  UserRole
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handling middleware for Zod validation errors
  const handleZodError = (error: unknown) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return { error: validationError.message };
    }
    return { error: String(error) };
  };

  // Set up authentication routes
  setupAuth(app);
  
  // Apply the dev auth middleware to all API routes
  app.use('/api', devAuthMiddleware);

  // USER ROUTES
  app.get("/api/protected/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const { role, department, year, email } = req.query;
      
      if (email) {
        // If email is provided, fetch user by email
        const user = await storage.getUserByEmail(email as string);
        if (user) {
          res.json({ users: [{ ...user, password: undefined }] });
        } else {
          res.json({ users: [] });
        }
        return;
      }
      
      // Otherwise, get users by role, department, and year
      const users = await storage.getUsers({
        role: role as string,
        department: department as string,
        year: year as string
      });
      
      res.json({ users: users.map(user => ({ ...user, password: undefined })) });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // DEPARTMENT ROUTES
  app.post("/api/admin/departments", async (req, res) => {
    try {
      const departmentData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(departmentData);
      res.json({ department });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });

  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json({ departments });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/departments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const department = await storage.getDepartment(id);
      
      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }
      
      res.json({ department });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // SUBJECT ROUTES
  app.post("/api/admin/subjects", async (req, res) => {
    try {
      const subjectData = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(subjectData);
      res.json({ subject });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });
  
  // Faculty can create their own subjects/courses
  app.post("/api/protected/subjects", async (req, res) => {
    try {
      const user = req.user as Express.User;
      const subjectData = insertSubjectSchema.parse({
        ...req.body,
        facultyId: user.id // Ensure the faculty ID is set to the current user's ID
      });
      
      const subject = await storage.createSubject(subjectData);
      res.json({ subject });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });

  app.get("/api/subjects", async (req, res) => {
    try {
      const { departmentId, year, facultyId } = req.query;
      
      const subjects = await storage.getSubjects({
        departmentId: departmentId ? parseInt(departmentId as string) : undefined,
        year: year as string,
        facultyId: facultyId ? parseInt(facultyId as string) : undefined
      });
      
      res.json({ subjects });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/subjects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subject = await storage.getSubject(id);
      
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }
      
      res.json({ subject });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // TIMETABLE ROUTES
  app.post("/api/admin/timetable", async (req, res) => {
    try {
      const entryData = insertTimetableEntrySchema.parse(req.body);
      const entry = await storage.createTimetableEntry(entryData);
      res.json({ entry });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });
  
  // Faculty can create their own timetable entries
  app.post("/api/protected/timetable", async (req, res) => {
    try {
      const user = req.user as Express.User;
      const entryData = insertTimetableEntrySchema.parse({
        ...req.body,
        facultyId: user.id // Ensure the faculty ID is set to the current user's ID
      });
      
      const entry = await storage.createTimetableEntry(entryData);
      res.json({ entry });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });

  app.get("/api/timetable", async (req, res) => {
    try {
      const { subjectId, facultyId, dayOfWeek } = req.query;
      
      const entries = await storage.getTimetableEntries({
        subjectId: subjectId ? parseInt(subjectId as string) : undefined,
        facultyId: facultyId ? parseInt(facultyId as string) : undefined,
        dayOfWeek: dayOfWeek as string
      });
      
      res.json({ entries });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // ATTENDANCE ROUTES
  app.post("/api/admin/attendance", async (req, res) => {
    try {
      const attendanceData = insertAttendanceRecordSchema.parse(req.body);
      const record = await storage.createAttendanceRecord(attendanceData);
      res.json({ record });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });
  
  // Faculty can record attendance for their own courses
  app.post("/api/protected/attendance", async (req, res) => {
    try {
      const user = req.user as Express.User;
      const { facultyId, dev, ...restData } = req.body;
      
      // Log the request for debugging
      console.log("MANUAL ATTENDANCE REQUEST:", {
        userFromSession: user?.id,
        userFromBody: facultyId,
        isDev: !!dev
      });
      
      // Use facultyId from body as fallback for development
      let effectiveFacultyId = user?.id;
      
      // If we're in dev mode and have no user, use the provided facultyId or default to 1
      if ((!effectiveFacultyId || effectiveFacultyId <= 0) && (dev === true || req.query.dev === 'true')) {
        effectiveFacultyId = facultyId || 1;
        console.log("Using development facultyId for manual attendance:", effectiveFacultyId);
      }
      
      if (!effectiveFacultyId) {
        return res.status(401).json({ error: "Authentication required. No valid faculty ID found." });
      }
      
      const attendanceData = insertAttendanceRecordSchema.parse({
        ...restData,
        facultyId: effectiveFacultyId // Use the effective faculty ID
      });
      
      const record = await storage.createAttendanceRecord(attendanceData);
      console.log("Attendance record created successfully for faculty:", effectiveFacultyId);
      res.json({ record });
    } catch (error) {
      console.error("Manual attendance error:", error);
      if (error instanceof ZodError) {
        res.status(400).json(handleZodError(error));
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  });

  app.get("/api/attendance", async (req, res) => {
    try {
      const { subjectId, studentId, facultyId, date } = req.query;
      
      const records = await storage.getAttendanceRecords({
        subjectId: subjectId ? parseInt(subjectId as string) : undefined,
        studentId: studentId ? parseInt(studentId as string) : undefined,
        facultyId: facultyId ? parseInt(facultyId as string) : undefined,
        date: date as string
      });
      
      res.json({ records });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/attendance/summary/student/:studentId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const summary = await storage.getStudentAttendanceSummary(studentId);
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/protected/attendance/qr-code", async (req, res) => {
    try {
      const user = req.user as Express.User;
      const { subjectId, date, facultyId, dev } = req.body;
      
      if (!subjectId || !date) {
        return res.status(400).json({ error: "Subject ID and date are required" });
      }
      
      // Log the request for debugging
      console.log("QR CODE GENERATION REQUEST:", {
        userFromSession: user?.id,
        userFromBody: facultyId,
        subjectId,
        date,
        isDev: !!dev
      });
      
      // Use facultyId from body as fallback for development
      let effectiveFacultyId = user?.id;
      
      // If we're in dev mode and have no user, use the provided facultyId or default to 1
      if ((!effectiveFacultyId || effectiveFacultyId <= 0) && (dev === true || req.query.dev === 'true')) {
        effectiveFacultyId = facultyId || 1;
        console.log("Using development facultyId:", effectiveFacultyId);
      }
      
      if (!effectiveFacultyId) {
        return res.status(401).json({ error: "Authentication required. No valid faculty ID found." });
      }
      
      const qrCode = await storage.generateAttendanceQrCode(
        effectiveFacultyId,
        parseInt(subjectId), 
        date
      );
      
      console.log("QR code generated successfully for faculty:", effectiveFacultyId);
      res.json({ qrCode });
    } catch (error) {
      console.error("QR code generation error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/api/attendance/scan", async (req, res) => {
    try {
      const { qrCode, studentId } = req.body;
      
      if (!qrCode || !studentId) {
        return res.status(400).json({ error: "QR code and student ID are required" });
      }
      
      const result = await storage.markAttendanceByQrCode(qrCode, parseInt(studentId));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
  
  app.post("/api/attendance/mark", async (req, res) => {
    try {
      const { qrCode, studentId } = req.body;
      
      if (!qrCode || !studentId) {
        return res.status(400).json({ error: "QR code and student ID are required" });
      }
      
      const result = await storage.markAttendanceByQrCode(qrCode, parseInt(studentId));
      
      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }
      
      res.json({ success: true, message: result.message });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // EVENT ROUTES
  app.post("/api/admin/events", async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.json({ event });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });
  
  // Faculty can create events
  app.post("/api/protected/events", async (req, res) => {
    try {
      const user = req.user as Express.User;
      const eventData = insertEventSchema.parse({
        ...req.body,
        facultyId: user.id // Ensure the faculty ID is set to the current user's ID
      });
      
      const event = await storage.createEvent(eventData);
      res.json({ event });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });

  app.get("/api/events", async (req, res) => {
    try {
      const { facultyId, departmentId, year, startDate, endDate } = req.query;
      
      const events = await storage.getEvents({
        facultyId: facultyId ? parseInt(facultyId as string) : undefined,
        departmentId: departmentId ? parseInt(departmentId as string) : undefined,
        year: year as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      
      res.json({ events });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json({ event });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // NOTES ROUTES
  app.post("/api/admin/notes", async (req, res) => {
    try {
      const noteData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(noteData);
      res.json({ note });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });
  
  // Faculty can upload notes for their courses
  app.post("/api/protected/notes", async (req, res) => {
    try {
      const user = req.user as Express.User;
      const noteData = insertNoteSchema.parse({
        ...req.body,
        facultyId: user.id // Ensure the faculty ID is set to the current user's ID
      });
      
      const note = await storage.createNote(noteData);
      res.json({ note });
    } catch (error) {
      res.status(400).json(handleZodError(error));
    }
  });

  app.get("/api/notes", async (req, res) => {
    try {
      const { subjectId, facultyId } = req.query;
      
      const notes = await storage.getNotes({
        subjectId: subjectId ? parseInt(subjectId as string) : undefined,
        facultyId: facultyId ? parseInt(facultyId as string) : undefined
      });
      
      res.json({ notes });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
