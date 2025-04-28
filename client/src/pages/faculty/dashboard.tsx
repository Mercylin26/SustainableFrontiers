import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Timetable from "@/components/timetable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch courses
  const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/subjects', { facultyId: user?.id }],
    enabled: !!user,
  });

  // Fetch timetable
  const { data: timetableData, isLoading: isLoadingTimetable } = useQuery({
    queryKey: ['/api/timetable', { facultyId: user?.id, dayOfWeek: formatDate(currentDate).split(',')[0] }],
    enabled: !!user,
  });

  // Fetch upcoming events
  const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['/api/events', { facultyId: user?.id, startDate: new Date().toISOString() }],
    enabled: !!user,
  });

  // Fetch recent attendance records
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['/api/attendance', { facultyId: user?.id }],
    enabled: !!user,
  });

  const handlePreviousDay = () => {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setCurrentDate(prevDate);
  };

  const handleNextDay = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setCurrentDate(nextDate);
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Faculty Dashboard</h2>
        <p className="text-neutral-600">Welcome back, Prof. {user?.lastName}! Here's your overview.</p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard 
          icon="book" 
          iconColor="primary" 
          label="My Courses" 
          value={coursesData?.subjects?.length || 0}
          isLoading={isLoadingCourses}
        />
        
        <StatCard 
          icon="schedule" 
          iconColor="secondary" 
          label="Today's Classes" 
          value={timetableData?.entries?.length || 0}
          isLoading={isLoadingTimetable}
        />
        
        <StatCard 
          icon="event" 
          iconColor="accent" 
          label="Upcoming Events" 
          value={eventsData?.events?.length || 0}
          isLoading={isLoadingEvents}
        />
        
        <StatCard 
          icon="assignment_turned_in" 
          iconColor="success" 
          label="Attendance Records" 
          value={attendanceData?.records?.length || 0}
          isLoading={isLoadingAttendance}
        />
      </div>
      
      {/* Timetable */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Today's Schedule</h3>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={handlePreviousDay}>
              <span className="material-icons">chevron_left</span>
            </Button>
            <span className="py-1 px-2 text-neutral-800 font-medium">
              {formatDate(currentDate)}
            </span>
            <Button variant="ghost" size="icon" onClick={handleNextDay}>
              <span className="material-icons">chevron_right</span>
            </Button>
          </div>
        </div>
        
        <Timetable 
          entries={timetableData?.entries || []} 
          isLoading={isLoadingTimetable}
          isFaculty
        />
      </div>
      
      {/* Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button className="justify-start">
                <span className="material-icons mr-2">qr_code</span>
                Generate Attendance QR
              </Button>
              
              <Button className="justify-start">
                <span className="material-icons mr-2">add</span>
                Create New Course
              </Button>
              
              <Button className="justify-start">
                <span className="material-icons mr-2">schedule</span>
                Update Timetable
              </Button>
              
              <Button className="justify-start">
                <span className="material-icons mr-2">event</span>
                Create New Event
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Activities */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="attendance">
              <TabsList className="w-full">
                <TabsTrigger value="attendance" className="flex-1">Attendance</TabsTrigger>
                <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
              </TabsList>
              
              <TabsContent value="attendance" className="mt-4">
                {isLoadingAttendance ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center p-2 border-b border-neutral-200 last:border-0 animate-pulse">
                        <div className="h-8 w-8 rounded-full bg-neutral-200 mr-3"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : attendanceData?.records?.length > 0 ? (
                  <div className="space-y-1">
                    {attendanceData.records.slice(0, 5).map((record: any) => (
                      <div key={record.id} className="flex items-center p-2 border-b border-neutral-200 last:border-0">
                        <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                          {/* This would show student initials */}
                          <span>SN</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Student Name marked present</p>
                          <p className="text-xs text-neutral-500">{formatDate(record.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-neutral-500">
                    No recent attendance records
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="events" className="mt-4">
                {isLoadingEvents ? (
                  <div className="space-y-3">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="p-2 border-b border-neutral-200 last:border-0 animate-pulse">
                        <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : eventsData?.events?.length > 0 ? (
                  <div className="space-y-1">
                    {eventsData.events.slice(0, 5).map((event: any) => (
                      <div key={event.id} className="p-2 border-b border-neutral-200 last:border-0">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-neutral-500">{formatDate(event.startDate)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-neutral-500">
                    No upcoming events
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
