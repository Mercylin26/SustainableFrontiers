// Script to add events with correct timestamp format
import { storage } from "../server/storage";
import { db } from "../server/db";
import { events } from "../shared/schema";

async function addEvents() {
  console.log("Adding events...");
  
  // First clear the existing events
  console.log("Clearing existing events...");
  await db.delete(events);
  
  const eventsData = [
    {
      title: "College Annual Day",
      description: "Annual day celebration with cultural events and awards ceremony.",
      startDate: new Date().toISOString().split('T')[0], // Today
      endDate: new Date().toISOString().split('T')[0],
      location: "College Auditorium",
      departmentId: null, // College-wide event
      year: null, // For all years
      facultyId: null, // No specific faculty
      type: "cultural"
    },
    {
      title: "Technical Symposium",
      description: "A technical symposium featuring workshops, competitions, and talks.",
      startDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0], // 15 days from now
      endDate: new Date(new Date().setDate(new Date().getDate() + 16)).toISOString().split('T')[0], // 16 days from now
      location: "Engineering Block",
      departmentId: 1, // CSE department
      year: null, // For all years
      facultyId: null,
      type: "technical"
    },
    {
      title: "Guest Lecture on AI",
      description: "Guest lecture on recent advancements in Artificial Intelligence.",
      startDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0], // 7 days from now
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0], // 7 days from now
      location: "CSE Seminar Hall",
      departmentId: 1, // CSE department
      year: "3,4", // For 3rd and 4th years
      facultyId: null,
      type: "academic"
    },
    {
      title: "Career Guidance Workshop",
      description: "Workshop on career opportunities and preparation for campus placements.",
      startDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0], // 10 days from now
      endDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0], // 10 days from now
      location: "Central Seminar Hall",
      departmentId: null, // For all departments
      year: "4", // Only for final year
      facultyId: null,
      type: "career"
    }
  ];
  
  for (const eventData of eventsData) {
    try {
      const event = await storage.createEvent(eventData);
      console.log(`Created event: ${event.title}`);
    } catch (error) {
      console.error(`Error creating event ${eventData.title}:`, error);
    }
  }
  
  console.log("Event creation completed!");
}

// Run the function
addEvents().catch(console.error);