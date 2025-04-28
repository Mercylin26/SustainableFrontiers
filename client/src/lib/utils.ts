import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateTime(date: Date | string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return `${formatDate(d)} at ${formatTime(d)}`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function calculateAttendanceStatus(percentage: number): 'success' | 'warning' | 'error' {
  if (percentage >= 85) return 'success';
  if (percentage >= 75) return 'warning';
  return 'error';
}

export const departments = [
  { value: 'cse', label: 'Computer Science & Engineering', code: 'CSE' },
  { value: 'ece', label: 'Electronics & Communication Engineering', code: 'ECE' },
  { value: 'eee', label: 'Electrical & Electronics Engineering', code: 'EEE' },
  { value: 'ai', label: 'Artificial Intelligence', code: 'AI' },
  { value: 'me', label: 'Mechanical Engineering', code: 'ME' },
  { value: 'ce', label: 'Civil Engineering', code: 'CE' },
];

export const years = [
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
];

export const daysOfWeek = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
