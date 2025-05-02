// Seed data script to populate the database with initial values
import { storage } from "../server/storage";
import { departments as deptValues, years } from "../client/src/lib/utils";

async function seedDepartments() {
  console.log("Seeding departments...");
  
  for (const dept of deptValues) {
    try {
      const existingDept = await storage.getDepartmentByCode(dept.value);
      if (!existingDept) {
        const department = await storage.createDepartment({
          name: dept.label,
          code: dept.value,
          description: `The Department of ${dept.label} provides high-quality education and research opportunities.`
        });
        console.log(`Created department: ${department.name}`);
      } else {
        console.log(`Department ${dept.label} already exists.`);
      }
    } catch (error) {
      console.error(`Error creating department ${dept.label}:`, error);
    }
  }
}

async function seedSubjects() {
  console.log("Seeding subjects...");
  
  const subjects = [
    // CSE Subjects
    { name: "Data Structures", code: "CS201", departmentCode: "cse", year: "2", credits: 4 },
    { name: "Algorithms", code: "CS301", departmentCode: "cse", year: "3", credits: 4 },
    { name: "Computer Networks", code: "CS401", departmentCode: "cse", year: "4", credits: 3 },
    { name: "Database Management", code: "CS302", departmentCode: "cse", year: "3", credits: 4 },
    { name: "Operating Systems", code: "CS303", departmentCode: "cse", year: "3", credits: 4 },
    { name: "Programming Fundamentals", code: "CS101", departmentCode: "cse", year: "1", credits: 4 },
    
    // EEE Subjects
    { name: "Circuit Theory", code: "EE201", departmentCode: "eee", year: "2", credits: 4 },
    { name: "Digital Electronics", code: "EE301", departmentCode: "eee", year: "3", credits: 4 },
    { name: "Power Systems", code: "EE401", departmentCode: "eee", year: "4", credits: 3 },
    
    // Mechanical Subjects
    { name: "Thermodynamics", code: "ME201", departmentCode: "mech", year: "2", credits: 4 },
    { name: "Fluid Mechanics", code: "ME301", departmentCode: "mech", year: "3", credits: 4 },
    { name: "Manufacturing Processes", code: "ME401", departmentCode: "mech", year: "4", credits: 3 },
    
    // Civil Subjects
    { name: "Structural Analysis", code: "CE201", departmentCode: "civil", year: "2", credits: 4 },
    { name: "Geotechnical Engineering", code: "CE301", departmentCode: "civil", year: "3", credits: 4 },
    { name: "Transportation Engineering", code: "CE401", departmentCode: "civil", year: "4", credits: 3 }
  ];
  
  for (const subjectData of subjects) {
    try {
      const existingSubject = await storage.getSubjectByCode(subjectData.code);
      if (!existingSubject) {
        const department = await storage.getDepartmentByCode(subjectData.departmentCode);
        if (!department) {
          console.log(`Department ${subjectData.departmentCode} not found, skipping subject ${subjectData.name}`);
          continue;
        }
        
        const subject = await storage.createSubject({
          name: subjectData.name,
          code: subjectData.code,
          departmentId: department.id,
          year: subjectData.year,
          credits: subjectData.credits,
          description: `This course covers the fundamentals of ${subjectData.name}.`
        });
        console.log(`Created subject: ${subject.name}`);
      } else {
        console.log(`Subject ${subjectData.name} already exists.`);
      }
    } catch (error) {
      console.error(`Error creating subject ${subjectData.name}:`, error);
    }
  }
}

async function seedUsers() {
  console.log("Seeding users...");
  
  const users = [
    // Admin user
    {
      email: "admin@college.edu",
      password: "password123", // Will be hashed by storage.createUser
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      collegeId: "ADMIN001",
      department: "cse",
      year: null,
      position: "administrator",
      profilePicture: null
    },
    
    // Faculty users
    {
      email: "john.smith@college.edu",
      password: "password123",
      firstName: "John",
      lastName: "Smith",
      role: "faculty",
      collegeId: "FAC001",
      department: "cse",
      year: null,
      position: "professor",
      profilePicture: null
    },
    {
      email: "lisa.johnson@college.edu",
      password: "password123",
      firstName: "Lisa",
      lastName: "Johnson",
      role: "faculty",
      collegeId: "FAC002",
      department: "eee",
      year: null,
      position: "associate_professor",
      profilePicture: null
    },
    {
      email: "robert.williams@college.edu",
      password: "password123",
      firstName: "Robert",
      lastName: "Williams",
      role: "faculty",
      collegeId: "FAC003",
      department: "mech",
      year: null,
      position: "assistant_professor",
      profilePicture: null
    },
    
    // Student users
    {
      email: "alice.cooper@college.edu",
      password: "password123",
      firstName: "Alice",
      lastName: "Cooper",
      role: "student",
      collegeId: "STU001",
      department: "cse",
      year: "3",
      position: null,
      profilePicture: null
    },
    {
      email: "bob.dylan@college.edu",
      password: "password123",
      firstName: "Bob",
      lastName: "Dylan",
      role: "student",
      collegeId: "STU002",
      department: "cse",
      year: "3",
      position: null,
      profilePicture: null
    },
    {
      email: "charlie.parker@college.edu",
      password: "password123",
      firstName: "Charlie",
      lastName: "Parker",
      role: "student",
      collegeId: "STU003",
      department: "eee",
      year: "2",
      position: null,
      profilePicture: null
    },
    {
      email: "diana.ross@college.edu",
      password: "password123",
      firstName: "Diana",
      lastName: "Ross",
      role: "student",
      collegeId: "STU004",
      department: "mech",
      year: "4",
      position: null,
      profilePicture: null
    }
  ];
  
  for (const userData of users) {
    try {
      const existingUser = await storage.getUserByEmail(userData.email);
      if (!existingUser) {
        const user = await storage.createUser(userData);
        console.log(`Created user: ${user.firstName} ${user.lastName} (${user.role})`);
      } else {
        console.log(`User ${userData.email} already exists.`);
      }
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error);
    }
  }
}

async function seedTimetableEntries() {
  console.log("Seeding timetable entries...");
  
  // First get some users and subjects to reference
  const cseFaculty = await storage.getUserByEmail("john.smith@college.edu");
  const eeeFaculty = await storage.getUserByEmail("lisa.johnson@college.edu");
  const mechFaculty = await storage.getUserByEmail("robert.williams@college.edu");
  
  if (!cseFaculty || !eeeFaculty || !mechFaculty) {
    console.error("Faculty users not found, please run seed users first");
    return;
  }
  
  const subjects = await storage.getSubjects({});
  if (subjects.length === 0) {
    console.error("No subjects found, please run seed subjects first");
    return;
  }
  
  // Create a mapping of department codes to subjects for easy lookup
  const subjectsByDept = {};
  for (const subject of subjects) {
    const dept = await storage.getDepartment(subject.departmentId);
    if (!dept) continue;
    
    if (!subjectsByDept[dept.code]) {
      subjectsByDept[dept.code] = [];
    }
    subjectsByDept[dept.code].push(subject);
  }
  
  // Generate timetable entries for CSE department
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = [
    { startTime: "09:00", endTime: "10:30" },
    { startTime: "10:45", endTime: "12:15" },
    { startTime: "13:00", endTime: "14:30" },
    { startTime: "14:45", endTime: "16:15" }
  ];
  
  // Assign CSE subjects to John Smith
  if (subjectsByDept["cse"]) {
    const cseSubjects = subjectsByDept["cse"].slice(0, 3); // Take first 3 CSE subjects
    
    for (let i = 0; i < cseSubjects.length; i++) {
      const subject = cseSubjects[i];
      const dayIndex = i % daysOfWeek.length;
      const timeIndex = (i % timeSlots.length);
      
      try {
        const timetableEntry = await storage.createTimetableEntry({
          subjectId: subject.id,
          facultyId: cseFaculty.id,
          dayOfWeek: daysOfWeek[dayIndex],
          startTime: timeSlots[timeIndex].startTime,
          endTime: timeSlots[timeIndex].endTime,
          classroom: `CSE-${100 + i}`,
        });
        console.log(`Created timetable entry: ${subject.name} on ${timetableEntry.dayOfWeek} at ${timetableEntry.startTime}`);
      } catch (error) {
        console.error(`Error creating timetable entry for ${subject.name}:`, error);
      }
    }
  }
  
  // Assign EEE subjects to Lisa Johnson
  if (subjectsByDept["eee"]) {
    const eeeSubjects = subjectsByDept["eee"];
    
    for (let i = 0; i < eeeSubjects.length; i++) {
      const subject = eeeSubjects[i];
      const dayIndex = (i + 1) % daysOfWeek.length;
      const timeIndex = (i + 1) % timeSlots.length;
      
      try {
        const timetableEntry = await storage.createTimetableEntry({
          subjectId: subject.id,
          facultyId: eeeFaculty.id,
          dayOfWeek: daysOfWeek[dayIndex],
          startTime: timeSlots[timeIndex].startTime,
          endTime: timeSlots[timeIndex].endTime,
          classroom: `EEE-${200 + i}`,
        });
        console.log(`Created timetable entry: ${subject.name} on ${timetableEntry.dayOfWeek} at ${timetableEntry.startTime}`);
      } catch (error) {
        console.error(`Error creating timetable entry for ${subject.name}:`, error);
      }
    }
  }
  
  // Assign MECH subjects to Robert Williams
  if (subjectsByDept["mech"]) {
    const mechSubjects = subjectsByDept["mech"];
    
    for (let i = 0; i < mechSubjects.length; i++) {
      const subject = mechSubjects[i];
      const dayIndex = (i + 2) % daysOfWeek.length;
      const timeIndex = (i + 2) % timeSlots.length;
      
      try {
        const timetableEntry = await storage.createTimetableEntry({
          subjectId: subject.id,
          facultyId: mechFaculty.id,
          dayOfWeek: daysOfWeek[dayIndex],
          startTime: timeSlots[timeIndex].startTime,
          endTime: timeSlots[timeIndex].endTime,
          classroom: `MECH-${300 + i}`,
        });
        console.log(`Created timetable entry: ${subject.name} on ${timetableEntry.dayOfWeek} at ${timetableEntry.startTime}`);
      } catch (error) {
        console.error(`Error creating timetable entry for ${subject.name}:`, error);
      }
    }
  }
}

async function seedEvents() {
  console.log("Seeding events...");
  
  const events = [
    {
      title: "College Annual Day",
      description: "Annual day celebration with cultural events and awards ceremony.",
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 30).toISOString(),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 30).toISOString(),
      location: "College Auditorium",
      departmentId: null, // College-wide event
      year: null, // For all years
      facultyId: null, // No specific faculty
      type: "cultural"
    },
    {
      title: "Technical Symposium",
      description: "A technical symposium featuring workshops, competitions, and talks.",
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 15).toISOString(),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 16).toISOString(),
      location: "Engineering Block",
      departmentId: 1, // CSE department
      year: null, // For all years
      facultyId: null,
      type: "technical"
    },
    {
      title: "Guest Lecture on AI",
      description: "Guest lecture on recent advancements in Artificial Intelligence.",
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 7).toISOString(),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 7).toISOString(),
      location: "CSE Seminar Hall",
      departmentId: 1, // CSE department
      year: "3,4", // For 3rd and 4th years
      facultyId: null,
      type: "academic"
    },
    {
      title: "Career Guidance Workshop",
      description: "Workshop on career opportunities and preparation for campus placements.",
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 10).toISOString(),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 10).toISOString(),
      location: "Central Seminar Hall",
      departmentId: null, // For all departments
      year: "4", // Only for final year
      facultyId: null,
      type: "career"
    }
  ];
  
  for (const eventData of events) {
    try {
      // If departmentId is a number, check if department exists
      if (eventData.departmentId !== null) {
        const department = await storage.getDepartment(eventData.departmentId);
        if (!department) {
          console.log(`Department with ID ${eventData.departmentId} not found, setting to null`);
          eventData.departmentId = null;
        }
      }
      
      const event = await storage.createEvent(eventData);
      console.log(`Created event: ${event.title}`);
    } catch (error) {
      console.error(`Error creating event ${eventData.title}:`, error);
    }
  }
}

async function seedNotes() {
  console.log("Seeding notes...");
  
  // Get faculty users
  const cseFaculty = await storage.getUserByEmail("john.smith@college.edu");
  
  if (!cseFaculty) {
    console.error("Faculty users not found, please run seed users first");
    return;
  }
  
  // Get CSE subjects
  const cseSubjects = await storage.getSubjects({ departmentId: 1 });
  if (cseSubjects.length === 0) {
    console.error("No CSE subjects found, please run seed subjects first");
    return;
  }
  
  const notes = [
    {
      title: "Introduction to Data Structures",
      content: "This note covers the basics of various data structures and their applications.",
      subjectId: cseSubjects[0].id,
      facultyId: cseFaculty.id,
      fileUrl: null
    },
    {
      title: "Algorithm Analysis Techniques",
      content: "Learn how to analyze the efficiency of algorithms using Big O notation.",
      subjectId: cseSubjects[1].id,
      facultyId: cseFaculty.id,
      fileUrl: null
    },
    {
      title: "Database Design Principles",
      content: "An overview of relational database design principles and normalization.",
      subjectId: cseSubjects[3].id,
      facultyId: cseFaculty.id,
      fileUrl: null
    }
  ];
  
  for (const noteData of notes) {
    try {
      const note = await storage.createNote(noteData);
      console.log(`Created note: ${note.title}`);
    } catch (error) {
      console.error(`Error creating note ${noteData.title}:`, error);
    }
  }
}

async function seedAttendanceRecords() {
  console.log("Seeding attendance records...");
  
  // Get student users
  const cseStudents = [
    await storage.getUserByEmail("alice.cooper@college.edu"),
    await storage.getUserByEmail("bob.dylan@college.edu")
  ].filter(Boolean);
  
  if (cseStudents.length === 0) {
    console.error("No CSE students found, please run seed users first");
    return;
  }
  
  // Get CSE subjects
  const cseSubjects = await storage.getSubjects({ departmentId: 1 });
  if (cseSubjects.length === 0) {
    console.error("No CSE subjects found, please run seed subjects first");
    return;
  }
  
  // Get faculty
  const cseFaculty = await storage.getUserByEmail("john.smith@college.edu");
  if (!cseFaculty) {
    console.error("CSE faculty not found, please run seed users first");
    return;
  }
  
  // Create attendance records for the past 30 days
  const today = new Date();
  const dates = [];
  
  for (let i = 30; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    // Only include weekdays (Monday to Friday)
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      dates.push(date.toISOString().split('T')[0]);
    }
  }
  
  for (const subject of cseSubjects.slice(0, 3)) {
    for (const student of cseStudents) {
      for (const date of dates) {
        // Random attendance status - 80% present, 20% absent
        const isPresent = Math.random() < 0.8;
        
        try {
          const record = await storage.createAttendanceRecord({
            subjectId: subject.id,
            studentId: student.id,
            facultyId: cseFaculty.id,
            date,
            status: isPresent ? "present" : "absent",
            remarks: isPresent ? "On time" : "Absent without notice"
          });
          console.log(`Created attendance record for ${student.firstName} on ${date} for ${subject.name}: ${record.status}`);
        } catch (error) {
          console.error(`Error creating attendance record:`, error);
        }
      }
    }
  }
}

// Main seed function
async function seedAll() {
  try {
    await seedDepartments();
    await seedUsers();
    await seedSubjects();
    await seedTimetableEntries();
    await seedEvents();
    await seedNotes();
    await seedAttendanceRecords();
    
    console.log("All seed data has been inserted successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}

// Run the seeding process
seedAll().catch(console.error);