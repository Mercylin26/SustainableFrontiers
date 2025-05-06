import { eq, inArray, gte, lte, count } from "drizzle-orm";
import { db } from "./db";
import { 
  users, 
  departments, 
  subjects, 
  timetableEntries, 
  attendanceRecords, 
  events, 
  notes,
  type User, 
  type InsertUser,
  type Department,
  type InsertDepartment,
  type Subject,
  type InsertSubject,
  type TimetableEntry,
  type InsertTimetableEntry,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type Event,
  type InsertEvent,
  type Note,
  type InsertNote,
  UserRole,
  type UserRoleType
} from "@shared/schema";
import { randomBytes } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByCollegeId(collegeId: string): Promise<User | undefined>;
  getUsers(options: { role?: string; department?: string; year?: string }): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;

  // Department methods
  getDepartment(id: number): Promise<Department | undefined>;
  getDepartmentByCode(code: string): Promise<Department | undefined>;
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;

  // Subject methods
  getSubject(id: number): Promise<Subject | undefined>;
  getSubjectByCode(code: string): Promise<Subject | undefined>;
  getSubjects(options: { departmentId?: number; year?: string; facultyId?: number }): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;

  // Timetable methods
  getTimetableEntries(options: { subjectId?: number; facultyId?: number; dayOfWeek?: string }): Promise<TimetableEntry[]>;
  createTimetableEntry(entry: InsertTimetableEntry): Promise<TimetableEntry>;

  // Attendance methods
  getAttendanceRecords(options: { subjectId?: number; studentId?: number; facultyId?: number; date?: string }): Promise<AttendanceRecord[]>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  getStudentAttendanceSummary(studentId: number): Promise<{ subjectId: number; subjectName: string; percentage: number }[]>;
  generateAttendanceQrCode(facultyId: number, subjectId: number, date: string): Promise<string>;
  markAttendanceByQrCode(qrCode: string, studentId: number): Promise<{ success: boolean; message: string }>;

  // Event methods
  getEvent(id: number): Promise<Event | undefined>;
  getEvents(options: { facultyId?: number; departmentId?: number; year?: string; startDate?: string; endDate?: string }): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;

  // Notes methods
  getNotes(options: { subjectId?: number; facultyId?: number }): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private departments: Map<number, Department>;
  private subjects: Map<number, Subject>;
  private timetableEntries: Map<number, TimetableEntry>;
  private attendanceRecords: Map<number, AttendanceRecord>;
  private events: Map<number, Event>;
  private notes: Map<number, Note>;
  private qrCodes: Map<string, { facultyId: number; subjectId: number; date: string; expiresAt: number }>;
  
  private userIdCounter: number;
  private departmentIdCounter: number;
  private subjectIdCounter: number;
  private timetableEntryIdCounter: number;
  private attendanceRecordIdCounter: number;
  private eventIdCounter: number;
  private noteIdCounter: number;

  constructor() {
    this.users = new Map();
    this.departments = new Map();
    this.subjects = new Map();
    this.timetableEntries = new Map();
    this.attendanceRecords = new Map();
    this.events = new Map();
    this.notes = new Map();
    this.qrCodes = new Map();

    this.userIdCounter = 1;
    this.departmentIdCounter = 1;
    this.subjectIdCounter = 1;
    this.timetableEntryIdCounter = 1;
    this.attendanceRecordIdCounter = 1;
    this.eventIdCounter = 1;
    this.noteIdCounter = 1;

    // Initialize with sample data
    this.initSampleData();
  }

  private initSampleData() {
    // Add sample departments
    const cse = this.createDepartment({
      name: "Computer Science & Engineering",
      code: "CSE",
      description: "Computer Science & Engineering Department"
    });

    const ece = this.createDepartment({
      name: "Electronics & Communication Engineering",
      code: "ECE",
      description: "Electronics & Communication Engineering Department"
    });

    // Add sample faculty
    const faculty1 = this.createUser({
      email: "johnson@college.edu",
      password: "password123",
      firstName: "Michael",
      lastName: "Johnson",
      collegeId: "FAC001",
      role: UserRole.FACULTY,
      department: "CSE",
      position: "Professor",
    });

    const faculty2 = this.createUser({
      email: "williams@college.edu",
      password: "password123",
      firstName: "Sarah",
      lastName: "Williams",
      collegeId: "FAC002",
      role: UserRole.FACULTY,
      department: "CSE",
      position: "Associate Professor",
    });

    // Add sample student
    const student = this.createUser({
      email: "emma@college.edu",
      password: "password123",
      firstName: "Emma",
      lastName: "Wilson",
      collegeId: "STU001",
      role: UserRole.STUDENT,
      department: "CSE",
      year: "3",
    });

    // Add sample subjects
    const subject1 = this.createSubject({
      code: "CSE-301",
      name: "Computer Architecture",
      departmentId: cse.id,
      year: "3",
      description: "Study of computer organization and architecture",
      facultyId: faculty1.id,
    });

    const subject2 = this.createSubject({
      code: "MKT-201",
      name: "Digital Marketing",
      departmentId: cse.id,
      year: "3",
      description: "Introduction to digital marketing concepts and strategies",
      facultyId: faculty2.id,
    });

    // Add sample timetable entries
    this.createTimetableEntry({
      subjectId: subject1.id,
      facultyId: faculty1.id,
      dayOfWeek: "Monday",
      startTime: "9:00 AM",
      endTime: "10:30 AM",
      room: "Room 305",
    });

    this.createTimetableEntry({
      subjectId: subject2.id,
      facultyId: faculty2.id,
      dayOfWeek: "Monday",
      startTime: "11:00 AM",
      endTime: "12:30 PM",
      room: "Room 201",
    });

    // Add sample attendance records
    this.createAttendanceRecord({
      subjectId: subject1.id,
      studentId: student.id,
      facultyId: faculty1.id,
      date: new Date(),
      status: true,
    });

    // Add sample events
    this.createEvent({
      title: "Tech Symposium 2023",
      description: "Annual technology symposium featuring industry experts",
      location: "Conference Hall",
      startDate: new Date("2023-07-15T09:00:00"),
      endDate: new Date("2023-07-15T16:00:00"),
      facultyId: faculty1.id,
      departmentId: cse.id,
    });

    // Add sample notes
    this.createNote({
      subjectId: subject1.id,
      facultyId: faculty1.id,
      title: "Introduction to CPU Architecture",
      content: "Notes on CPU architecture and organization",
      uploadDate: new Date(),
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByCollegeId(collegeId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.collegeId === collegeId);
  }

  async getUsers(options: { role?: string; department?: string; year?: string } = {}): Promise<User[]> {
    let filteredUsers = Array.from(this.users.values());
    
    if (options.role) {
      filteredUsers = filteredUsers.filter(user => user.role === options.role);
    }
    
    if (options.department) {
      filteredUsers = filteredUsers.filter(user => user.department === options.department);
    }
    
    if (options.year) {
      filteredUsers = filteredUsers.filter(user => user.year === options.year);
    }
    
    return filteredUsers;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Department methods
  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async getDepartmentByCode(code: string): Promise<Department | undefined> {
    return Array.from(this.departments.values()).find(dept => dept.code === code);
  }

  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.departmentIdCounter++;
    const department: Department = { ...insertDepartment, id };
    this.departments.set(id, department);
    return department;
  }

  // Subject methods
  async getSubject(id: number): Promise<Subject | undefined> {
    return this.subjects.get(id);
  }

  async getSubjectByCode(code: string): Promise<Subject | undefined> {
    return Array.from(this.subjects.values()).find(subject => subject.code === code);
  }

  async getSubjects(options: { departmentId?: number; year?: string; facultyId?: number } = {}): Promise<Subject[]> {
    let filteredSubjects = Array.from(this.subjects.values());
    
    if (options.departmentId) {
      filteredSubjects = filteredSubjects.filter(subject => subject.departmentId === options.departmentId);
    }
    
    if (options.year) {
      filteredSubjects = filteredSubjects.filter(subject => subject.year === options.year);
    }
    
    if (options.facultyId) {
      filteredSubjects = filteredSubjects.filter(subject => subject.facultyId === options.facultyId);
    }
    
    return filteredSubjects;
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const id = this.subjectIdCounter++;
    const subject: Subject = { ...insertSubject, id };
    this.subjects.set(id, subject);
    return subject;
  }

  // Timetable methods
  async getTimetableEntries(options: { subjectId?: number; facultyId?: number; dayOfWeek?: string } = {}): Promise<TimetableEntry[]> {
    let filteredEntries = Array.from(this.timetableEntries.values());
    
    if (options.subjectId) {
      filteredEntries = filteredEntries.filter(entry => entry.subjectId === options.subjectId);
    }
    
    if (options.facultyId) {
      filteredEntries = filteredEntries.filter(entry => entry.facultyId === options.facultyId);
    }
    
    if (options.dayOfWeek) {
      filteredEntries = filteredEntries.filter(entry => entry.dayOfWeek === options.dayOfWeek);
    }
    
    return filteredEntries;
  }

  async createTimetableEntry(insertEntry: InsertTimetableEntry): Promise<TimetableEntry> {
    const id = this.timetableEntryIdCounter++;
    const entry: TimetableEntry = { ...insertEntry, id };
    this.timetableEntries.set(id, entry);
    return entry;
  }

  // Attendance methods
  async getAttendanceRecords(options: { subjectId?: number; studentId?: number; facultyId?: number; date?: string } = {}): Promise<AttendanceRecord[]> {
    let filteredRecords = Array.from(this.attendanceRecords.values());
    
    if (options.subjectId) {
      filteredRecords = filteredRecords.filter(record => record.subjectId === options.subjectId);
    }
    
    if (options.studentId) {
      filteredRecords = filteredRecords.filter(record => record.studentId === options.studentId);
    }
    
    if (options.facultyId) {
      filteredRecords = filteredRecords.filter(record => record.facultyId === options.facultyId);
    }
    
    if (options.date) {
      const targetDate = new Date(options.date).toDateString();
      filteredRecords = filteredRecords.filter(record => record.date.toDateString() === targetDate);
    }
    
    return filteredRecords;
  }

  async createAttendanceRecord(insertRecord: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const id = this.attendanceRecordIdCounter++;
    const record: AttendanceRecord = { ...insertRecord, id };
    this.attendanceRecords.set(id, record);
    return record;
  }

  async getStudentAttendanceSummary(studentId: number): Promise<{ subjectId: number; subjectName: string; percentage: number }[]> {
    const studentRecords = await this.getAttendanceRecords({ studentId });
    const subjectIds = [...new Set(studentRecords.map(record => record.subjectId))];
    
    const summary = [];
    
    for (const subjectId of subjectIds) {
      const subject = await this.getSubject(subjectId);
      if (!subject) continue;
      
      const subjectRecords = studentRecords.filter(record => record.subjectId === subjectId);
      const totalClasses = subjectRecords.length;
      const presentClasses = subjectRecords.filter(record => record.status).length;
      
      const percentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;
      
      summary.push({
        subjectId,
        subjectName: subject.name,
        percentage: Math.round(percentage)
      });
    }
    
    return summary;
  }

  async generateAttendanceQrCode(facultyId: number, subjectId: number, date: string): Promise<string> {
    // Generate a random QR code
    const qrCode = randomBytes(16).toString('hex');
    
    // Store QR code with expiration (30 minutes)
    const expiresAt = Date.now() + 30 * 60 * 1000;
    this.qrCodes.set(qrCode, { facultyId, subjectId, date, expiresAt });
    
    return qrCode;
  }

  async markAttendanceByQrCode(qrCode: string, studentId: number): Promise<{ success: boolean; message: string }> {
    const qrData = this.qrCodes.get(qrCode);
    
    if (!qrData) {
      return { success: false, message: "Invalid QR code" };
    }
    
    if (Date.now() > qrData.expiresAt) {
      this.qrCodes.delete(qrCode);
      return { success: false, message: "QR code has expired" };
    }
    
    // Check if student already marked attendance
    const existingRecords = await this.getAttendanceRecords({
      subjectId: qrData.subjectId,
      studentId,
      date: qrData.date
    });
    
    if (existingRecords.length > 0) {
      return { success: false, message: "Attendance already marked" };
    }
    
    // Mark attendance
    await this.createAttendanceRecord({
      subjectId: qrData.subjectId,
      studentId,
      facultyId: qrData.facultyId,
      date: new Date(qrData.date),
      status: true,
      qrCode
    });
    
    return { success: true, message: "Attendance marked successfully" };
  }

  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEvents(options: { facultyId?: number; departmentId?: number; year?: string; startDate?: string; endDate?: string } = {}): Promise<Event[]> {
    let filteredEvents = Array.from(this.events.values());
    
    if (options.facultyId) {
      filteredEvents = filteredEvents.filter(event => event.facultyId === options.facultyId);
    }
    
    if (options.departmentId) {
      filteredEvents = filteredEvents.filter(event => event.departmentId === options.departmentId);
    }
    
    if (options.year) {
      filteredEvents = filteredEvents.filter(event => event.year === options.year);
    }
    
    if (options.startDate) {
      const startDate = new Date(options.startDate);
      filteredEvents = filteredEvents.filter(event => event.startDate >= startDate);
    }
    
    if (options.endDate) {
      const endDate = new Date(options.endDate);
      filteredEvents = filteredEvents.filter(event => event.startDate <= endDate);
    }
    
    return filteredEvents;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const event: Event = { ...insertEvent, id };
    this.events.set(id, event);
    return event;
  }

  // Notes methods
  async getNotes(options: { subjectId?: number; facultyId?: number } = {}): Promise<Note[]> {
    let filteredNotes = Array.from(this.notes.values());
    
    if (options.subjectId) {
      filteredNotes = filteredNotes.filter(note => note.subjectId === options.subjectId);
    }
    
    if (options.facultyId) {
      filteredNotes = filteredNotes.filter(note => note.facultyId === options.facultyId);
    }
    
    return filteredNotes;
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.noteIdCounter++;
    const note: Note = { ...insertNote, id };
    this.notes.set(id, note);
    return note;
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByCollegeId(collegeId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.collegeId, collegeId));
    return user;
  }

  async getUsers(options: { role?: string; department?: string; year?: string } = {}): Promise<User[]> {
    let query = db.select().from(users);
    
    if (options.role) {
      query = query.where(eq(users.role, options.role as UserRoleType));
    }
    
    if (options.department) {
      query = query.where(eq(users.department, options.department));
    }
    
    if (options.year) {
      query = query.where(eq(users.year, options.year));
    }
    
    return await query;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Department methods
  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.id, id));
    return department;
  }

  async getDepartmentByCode(code: string): Promise<Department | undefined> {
    const [department] = await db.select().from(departments).where(eq(departments.code, code));
    return department;
  }

  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db.insert(departments).values(insertDepartment).returning();
    return department;
  }

  // Subject methods
  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async getSubjectByCode(code: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.code, code));
    return subject;
  }

  async getSubjects(options: { departmentId?: number; year?: string; facultyId?: number } = {}): Promise<Subject[]> {
    let query = db.select().from(subjects);
    
    if (options.departmentId) {
      query = query.where(eq(subjects.departmentId, options.departmentId));
    }
    
    if (options.year) {
      query = query.where(eq(subjects.year, options.year));
    }
    
    if (options.facultyId) {
      // For faculty subjects, we need to join with timetable_entries
      // This is a more complex query that filters subjects taught by a faculty
      const subjectsForFaculty = await db
        .select({ subjectId: timetableEntries.subjectId })
        .from(timetableEntries)
        .where(eq(timetableEntries.facultyId, options.facultyId));
      
      const subjectIds = [...new Set(subjectsForFaculty.map(entry => entry.subjectId))];
      
      if (subjectIds.length > 0) {
        query = query.where(inArray(subjects.id, subjectIds));
      } else {
        return []; // No subjects for this faculty
      }
    }
    
    return await query;
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const [subject] = await db.insert(subjects).values(insertSubject).returning();
    return subject;
  }

  // Timetable methods
  async getTimetableEntries(options: { subjectId?: number; facultyId?: number; dayOfWeek?: string } = {}): Promise<TimetableEntry[]> {
    let query = db.select().from(timetableEntries);
    
    if (options.subjectId) {
      query = query.where(eq(timetableEntries.subjectId, options.subjectId));
    }
    
    if (options.facultyId) {
      query = query.where(eq(timetableEntries.facultyId, options.facultyId));
    }
    
    if (options.dayOfWeek) {
      query = query.where(eq(timetableEntries.dayOfWeek, options.dayOfWeek));
    }
    
    return await query;
  }

  async createTimetableEntry(insertEntry: InsertTimetableEntry): Promise<TimetableEntry> {
    const [entry] = await db.insert(timetableEntries).values(insertEntry).returning();
    return entry;
  }

  // Attendance methods
  async getAttendanceRecords(options: { subjectId?: number; studentId?: number; facultyId?: number; date?: string } = {}): Promise<AttendanceRecord[]> {
    let query = db.select().from(attendanceRecords);
    
    if (options.subjectId) {
      query = query.where(eq(attendanceRecords.subjectId, options.subjectId));
    }
    
    if (options.studentId) {
      query = query.where(eq(attendanceRecords.studentId, options.studentId));
    }
    
    if (options.facultyId) {
      // For records marked by a specific faculty, join with subjects and timetable_entries
      const entriesForFaculty = await db
        .select({ subjectId: timetableEntries.subjectId })
        .from(timetableEntries)
        .where(eq(timetableEntries.facultyId, options.facultyId));
      
      const subjectIds = [...new Set(entriesForFaculty.map(entry => entry.subjectId))];
      
      if (subjectIds.length > 0) {
        query = query.where(inArray(attendanceRecords.subjectId, subjectIds));
      } else {
        return []; // No attendance records for this faculty
      }
    }
    
    if (options.date) {
      query = query.where(eq(attendanceRecords.date, options.date));
    }
    
    return await query;
  }

  async createAttendanceRecord(insertRecord: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const [record] = await db.insert(attendanceRecords).values(insertRecord).returning();
    return record;
  }

  async getStudentAttendanceSummary(studentId: number): Promise<{ subjectId: number; subjectName: string; percentage: number }[]> {
    // Get all subjects the student is taking
    const studentSubjects = await db
      .select({
        id: subjects.id,
        name: subjects.name,
      })
      .from(subjects)
      .innerJoin(attendanceRecords, eq(subjects.id, attendanceRecords.subjectId))
      .where(eq(attendanceRecords.studentId, studentId))
      .groupBy(subjects.id, subjects.name);

    // Calculate attendance percentage for each subject
    const result = await Promise.all(
      studentSubjects.map(async (subject) => {
        // Count total classes for this subject
        const totalClassesResult = await db
          .select({ count: count() })
          .from(attendanceRecords)
          .where(eq(attendanceRecords.subjectId, subject.id))
          .groupBy(attendanceRecords.date);

        const totalClasses = totalClassesResult.length;

        // Count classes attended by the student
        const attendedClassesResult = await db
          .select({ count: count() })
          .from(attendanceRecords)
          .where(eq(attendanceRecords.subjectId, subject.id))
          .where(eq(attendanceRecords.studentId, studentId))
          .where(eq(attendanceRecords.status, "present"));

        const attendedClasses = attendedClassesResult[0]?.count || 0;
        
        // Calculate percentage
        const percentage = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

        return {
          subjectId: subject.id,
          subjectName: subject.name,
          percentage: Math.round(percentage),
        };
      })
    );

    return result;
  }

  // Manage QR code generation and attendance marking
  private qrCodes = new Map<string, { facultyId: number; subjectId: number; date: string; expiresAt: number }>();

  async generateAttendanceQrCode(facultyId: number, subjectId: number, date: string): Promise<string> {
    // Generate a random QR code
    const qrCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // QR code expires in 5 minutes
    const expiresAt = Date.now() + 5 * 60 * 1000;
    
    this.qrCodes.set(qrCode, { facultyId, subjectId, date, expiresAt });
    
    return qrCode;
  }

  async markAttendanceByQrCode(qrCode: string, studentId: number): Promise<{ success: boolean; message: string }> {
    const qrData = this.qrCodes.get(qrCode);
    
    if (!qrData) {
      return { success: false, message: "Invalid QR code" };
    }
    
    if (Date.now() > qrData.expiresAt) {
      this.qrCodes.delete(qrCode);
      return { success: false, message: "QR code has expired" };
    }
    
    // Check if this student has already marked attendance for this class
    const existingRecord = await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.subjectId, qrData.subjectId))
      .where(eq(attendanceRecords.studentId, studentId))
      .where(eq(attendanceRecords.date, qrData.date));
    
    if (existingRecord.length > 0) {
      return { success: false, message: "Attendance already marked for this class" };
    }
    
    // Mark attendance as present
    await this.createAttendanceRecord({
      subjectId: qrData.subjectId,
      studentId,
      date: qrData.date,
      status: "present",
    });
    
    return { success: true, message: "Attendance marked successfully" };
  }

  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEvents(options: { facultyId?: number; departmentId?: number; year?: string; startDate?: string; endDate?: string } = {}): Promise<Event[]> {
    let query = db.select().from(events);
    
    if (options.facultyId) {
      query = query.where(eq(events.facultyId, options.facultyId));
    }
    
    if (options.departmentId) {
      query = query.where(eq(events.departmentId, options.departmentId));
    }
    
    if (options.year) {
      query = query.where(eq(events.targetYear, options.year));
    }
    
    if (options.startDate) {
      query = query.where(gte(events.startDate, options.startDate));
    }
    
    if (options.endDate) {
      query = query.where(lte(events.endDate, options.endDate));
    }
    
    return await query;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  // Notes methods
  async getNotes(options: { subjectId?: number; facultyId?: number } = {}): Promise<Note[]> {
    let query = db.select().from(notes);
    
    if (options.subjectId) {
      query = query.where(eq(notes.subjectId, options.subjectId));
    }
    
    if (options.facultyId) {
      query = query.where(eq(notes.facultyId, options.facultyId));
    }
    
    return await query;
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const [note] = await db.insert(notes).values(insertNote).returning();
    return note;
  }
}

// Use in-memory storage until database issues are resolved
// This will allow the application to work without database connectivity
export const storage = new MemStorage();
