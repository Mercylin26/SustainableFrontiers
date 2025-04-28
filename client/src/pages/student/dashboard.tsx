import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/ui/stat-card";
import SubjectCard from "@/components/ui/subject-card";
import EventCard from "@/components/ui/event-card";
import Timetable from "@/components/timetable";
import QRCode from "@/components/ui/qr-code";
import { formatDate } from "@/lib/utils";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch subjects
  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['/api/subjects', { departmentId: user?.department, year: user?.year }],
    enabled: !!user,
  });

  // Fetch timetable
  const { data: timetableData, isLoading: isLoadingTimetable } = useQuery({
    queryKey: ['/api/timetable', { dayOfWeek: formatDate(currentDate).split(',')[0] }],
    enabled: !!user,
  });

  // Fetch attendance summary
  const { data: attendanceSummary, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['/api/attendance/summary/student', user?.id],
    enabled: !!user,
  });

  // Fetch upcoming events
  const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['/api/events', { startDate: new Date().toISOString() }],
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

  // Calculate stats
  const overallAttendance = attendanceSummary?.summary?.reduce(
    (sum: number, subject: any) => sum + subject.percentage, 
    0
  ) / (attendanceSummary?.summary?.length || 1);

  const upcomingClasses = timetableData?.entries?.length || 0;
  const upcomingEvents = eventsData?.events?.length || 0;

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Student Dashboard</h2>
        <p className="text-neutral-600">Welcome back, {user?.firstName}! Here's what's happening today.</p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard 
          icon="calendar_today" 
          iconColor="primary" 
          label="Upcoming Classes" 
          value={upcomingClasses}
          isLoading={isLoadingTimetable}
        />
        
        <StatCard 
          icon="assignment_turned_in" 
          iconColor="success" 
          label="Overall Attendance" 
          value={`${Math.round(overallAttendance || 0)}%`}
          isLoading={isLoadingAttendance}
        />
        
        <StatCard 
          icon="event" 
          iconColor="accent" 
          label="Upcoming Events" 
          value={upcomingEvents}
          isLoading={isLoadingEvents}
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
        />
      </div>
      
      {/* Subjects and Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subjects Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">My Subjects</h3>
              <Button variant="link" size="sm">View All</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoadingSubjects ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="border border-neutral-200 rounded-lg p-4 animate-pulse">
                    <div className="h-5 bg-neutral-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-neutral-200 rounded w-1/2 mb-3"></div>
                    <div className="h-4 bg-neutral-200 rounded w-2/3 mb-3"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-neutral-200 rounded w-1/4"></div>
                      <div className="h-6 bg-neutral-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))
              ) : subjectsData?.subjects?.length > 0 ? (
                subjectsData.subjects.map((subject: any) => (
                  <SubjectCard 
                    key={subject.id}
                    subject={subject}
                    attendance={attendanceSummary?.summary?.find((s: any) => s.subjectId === subject.id)?.percentage || 0}
                  />
                ))
              ) : (
                <p className="col-span-2 text-center py-4 text-neutral-500">No subjects found</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Events Section */}
        <div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Upcoming Events</h3>
              <Button variant="link" size="sm">View All</Button>
            </div>
            
            {isLoadingEvents ? (
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="border-b border-neutral-200 pb-4 mb-4 animate-pulse">
                  <div className="flex">
                    <div className="flex-shrink-0 w-12 h-14 bg-neutral-200 rounded-lg mr-3"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-neutral-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-neutral-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-neutral-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : eventsData?.events?.length > 0 ? (
              eventsData.events.slice(0, 3).map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <p className="text-center py-4 text-neutral-500">No upcoming events</p>
            )}
            
            <div className="pt-2">
              <h3 className="text-lg font-bold mb-4">Quick Attendance</h3>
              <div className="bg-neutral-100 rounded-lg p-4 text-center">
                <QRCode />
                <Button className="w-full mt-3">
                  <span className="material-icons mr-2">camera_alt</span>
                  Scan QR Code
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
