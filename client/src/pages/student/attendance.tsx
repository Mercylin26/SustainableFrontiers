import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import QRCode from "@/components/ui/qr-code";
import QRScanner from "@/components/ui/qr-scanner";
import { format } from "date-fns";
import { calculateAttendanceStatus } from "@/lib/utils";

export default function StudentAttendance() {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  // Fetch subjects
  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['/api/subjects', { departmentId: user?.department, year: user?.year }],
    enabled: !!user,
  });
  
  // Fetch attendance summary
  const { data: attendanceSummary, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['/api/attendance/summary/student', user?.id],
    enabled: !!user,
  });
  
  // Fetch attendance records for specific subject
  const { data: attendanceRecords, isLoading: isLoadingRecords } = useQuery({
    queryKey: ['/api/attendance', { studentId: user?.id, subjectId: selectedSubject }],
    enabled: !!user && !!selectedSubject,
  });
  
  // Calculate overall attendance
  const overallAttendance = attendanceSummary?.summary?.reduce(
    (sum: number, subject: any) => sum + subject.percentage, 
    0
  ) / (attendanceSummary?.summary?.length || 1);
  
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Attendance Management</h2>
        <p className="text-neutral-600">View and manage your attendance records.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-neutral-600">Overall Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{Math.round(overallAttendance || 0)}%</span>
              <div className={`text-sm px-2 py-1 rounded-full ${
                calculateAttendanceStatus(overallAttendance) === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : calculateAttendanceStatus(overallAttendance) === 'warning'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {overallAttendance >= 85 
                  ? 'Excellent' 
                  : overallAttendance >= 75 
                  ? 'Good'
                  : 'Needs Improvement'}
              </div>
            </div>
            <Progress 
              value={overallAttendance || 0} 
              className="h-2 mt-2" 
              indicatorClassName={
                calculateAttendanceStatus(overallAttendance) === 'success' 
                  ? 'bg-green-500' 
                  : calculateAttendanceStatus(overallAttendance) === 'warning'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }
            />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-neutral-600">Quick Attendance Marking</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center md:flex-row md:justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="font-medium mb-1">Scan the QR code</h3>
              <p className="text-sm text-neutral-600">Use the QR code provided by your professor to mark your attendance.</p>
              <QRScanner 
                studentId={user?.id || 0}
                onSuccess={() => {
                  // Refresh the attendance data
                  window.location.reload();
                }}
              />
            </div>
            <div className="hidden md:block">
              <QRCode size={120} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="records">
        <TabsList className="mb-4">
          <TabsTrigger value="records">Attendance Records</TabsTrigger>
          <TabsTrigger value="subject-wise">Subject Wise Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="records">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Attendance Records</h3>
                <div className="w-64">
                  <Select onValueChange={(value) => setSelectedSubject(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Subjects</SelectItem>
                      {subjectsData?.subjects?.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Marked By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingRecords ? (
                      Array(5).fill(0).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="h-4 bg-neutral-200 rounded w-24 animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-neutral-200 rounded w-40 animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-neutral-200 rounded w-16 animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-neutral-200 rounded w-32 animate-pulse"></div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : attendanceRecords?.records?.length > 0 ? (
                      attendanceRecords.records.map((record: any) => {
                        const subject = subjectsData?.subjects?.find(
                          (s: any) => s.id === record.subjectId
                        );
                        return (
                          <TableRow key={record.id}>
                            <TableCell>{format(new Date(record.date), 'PPP')}</TableCell>
                            <TableCell>{subject?.name || 'Unknown Subject'}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                record.status 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {record.status ? 'Present' : 'Absent'}
                              </span>
                            </TableCell>
                            <TableCell>Professor</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-neutral-500">
                          No attendance records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subject-wise">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">Subject Wise Attendance</h3>
              
              <div className="space-y-6">
                {isLoadingAttendance ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex justify-between items-center mb-2">
                        <div className="h-5 bg-neutral-200 rounded w-40"></div>
                        <div className="h-5 bg-neutral-200 rounded w-10"></div>
                      </div>
                      <div className="h-4 bg-neutral-200 rounded w-full"></div>
                    </div>
                  ))
                ) : attendanceSummary?.summary?.length > 0 ? (
                  attendanceSummary.summary.map((subject: any) => {
                    const status = calculateAttendanceStatus(subject.percentage);
                    return (
                      <div key={subject.subjectId}>
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-medium">{subject.subjectName}</h4>
                          <span className="font-bold">{subject.percentage}%</span>
                        </div>
                        <Progress 
                          value={subject.percentage} 
                          className="h-2" 
                          indicatorClassName={
                            status === 'success' 
                              ? 'bg-green-500' 
                              : status === 'warning'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }
                        />
                        <div className="flex justify-end mt-1">
                          <span className={`text-xs ${
                            status === 'success' 
                              ? 'text-green-600' 
                              : status === 'warning'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {subject.percentage >= 85 
                              ? 'Excellent' 
                              : subject.percentage >= 75 
                              ? 'Good'
                              : 'Needs Improvement'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-neutral-500">
                    No attendance data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
