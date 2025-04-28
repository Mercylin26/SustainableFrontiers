import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { daysOfWeek } from "@/lib/utils";

interface TimetableProps {
  entries: any[];
  isLoading?: boolean;
  showDaySelector?: boolean;
  isFaculty?: boolean;
}

export default function Timetable({
  entries = [],
  isLoading = false,
  showDaySelector = false,
  isFaculty = false,
}: TimetableProps) {
  const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
  
  // Filter entries by selected day if day selector is shown
  const filteredEntries = showDaySelector 
    ? entries.filter(entry => entry.dayOfWeek === selectedDay)
    : entries;
  
  return (
    <div>
      {showDaySelector && (
        <Tabs value={selectedDay} onValueChange={setSelectedDay} className="mb-4">
          <TabsList className="w-full">
            {daysOfWeek.map(day => (
              <TabsTrigger key={day} value={day} className="flex-1">
                {day}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Subject</TableHead>
              {isFaculty ? (
                <TableHead>Students</TableHead>
              ) : (
                <TableHead>Instructor</TableHead>
              )}
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Skeleton className="h-5 w-5 rounded-full mr-2" />
                      <Skeleton className="h-5 w-40" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredEntries.length > 0 ? (
              filteredEntries.map((entry, index) => {
                // Subject code colors based on department
                const subjectColors = {
                  "CSE": "bg-primary",
                  "MKT": "bg-accent",
                  "ECE": "bg-secondary",
                  "default": "bg-primary",
                };
                
                // Extract subject code prefix for color
                const subjectPrefix = entry.subjectCode?.split('-')[0] || "default";
                const colorClass = subjectColors[subjectPrefix as keyof typeof subjectColors] || subjectColors.default;
                
                return (
                  <TableRow key={entry.id || index}>
                    <TableCell className="text-sm text-neutral-800">
                      {entry.startTime} - {entry.endTime}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${colorClass} mr-2`}></div>
                        <span className="text-neutral-800 font-medium">{entry.subjectName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-neutral-600">
                      {isFaculty ? `${entry.studentCount || 0} Students` : entry.instructorName}
                    </TableCell>
                    <TableCell className="text-sm text-neutral-600">{entry.room}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-neutral-500">
                  No classes scheduled {showDaySelector ? `for ${selectedDay}` : "today"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
