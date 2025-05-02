import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Defining user roles
export const UserRole = {
  STUDENT: "student",
  FACULTY: "faculty",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  collegeId: text("college_id").notNull().unique(),
  role: text("role").notNull().$type<UserRoleType>(),
  department: text("department").notNull(),
  year: text("year"),
  position: text("position"),
  profilePicture: text("profile_picture"),
});

// Departments table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  description: text("description"),
});

// Subjects table
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  departmentId: integer("department_id").notNull(),
  year: text("year").notNull(),
  description: text("description"),
  facultyId: integer("faculty_id"),
});

// Timetable entries
export const timetableEntries = pgTable("timetable_entries", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(),
  facultyId: integer("faculty_id").notNull(),
  dayOfWeek: text("day_of_week").notNull(), // Monday, Tuesday, etc.
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  room: text("room"),
});

// Attendance records
export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(),
  studentId: integer("student_id").notNull(),
  facultyId: integer("faculty_id").notNull(),
  date: timestamp("date").notNull(),
  status: boolean("status").notNull(), // Present or absent
  qrCode: text("qr_code"),
});

// Events
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  facultyId: integer("faculty_id"),
  departmentId: integer("department_id"),
  year: text("year"), // Optional, for year-specific events
  type: text("type"), // Event type (cultural, technical, etc.)
});

// Notes (Syllabus & Notes)
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(),
  facultyId: integer("faculty_id").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  fileUrl: text("file_url"),
  uploadDate: timestamp("upload_date").notNull(),
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true });
export const insertTimetableEntrySchema = createInsertSchema(timetableEntries).omit({ id: true });
export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertNoteSchema = createInsertSchema(notes).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type TimetableEntry = typeof timetableEntries.$inferSelect;
export type InsertTimetableEntry = z.infer<typeof insertTimetableEntrySchema>;

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
