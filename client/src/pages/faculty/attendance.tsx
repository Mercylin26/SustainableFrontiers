import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import QRCode from "@/components/ui/qr-code";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

const generateQRSchema = z.object({
  subjectId: z.string().min(1, { message: "Subject is required" }),
  date: z.string().min(1, { message: "Date is required" }),
});

export default function FacultyAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerateQROpen, setIsGenerateQROpen] = useState(false);
  const [isManualMarkingOpen, setIsManualMarkingOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [generatedQRCode, setGeneratedQRCode] = useState<string | null>(null);

  // Fetch courses (subjects)
  const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/subjects', { facultyId: user?.id }],
    enabled: !!user,
  });

  // Fetch students
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/users', { role: 'student' }],
    enabled: !!user,
  });

  // Fetch attendance records
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['/api/attendance', { facultyId: user?.id, subjectId: selectedSubject }],
    enabled: !!user && !!selectedSubject,
  });

  // Generate QR code mutation
  const generateQRMutation = useMutation({
    mutationFn: async (data: z.infer<typeof generateQRSchema>) => {
      // Try to refresh auth before making the request
      try {
        if (!user?.id) {
          console.log("No user ID found, attempting to establish development session...");
          // Try to establish a development session
          await fetch('/api/auth/dev-session', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (authError) {
        console.error("Failed to refresh auth:", authError);
      }
      
      return apiRequest('POST', '/api/protected/attendance/qr-code', {
        // Include all parameters explicitly for better error handling
        facultyId: user?.id || 1, // Fallback to default faculty ID if needed
        subjectId: parseInt(data.subjectId),
        date: data.date,
        dev: true, // Additional parameter for development auth
      });
    },
    onSuccess: (response) => {
      response.json().then((data) => {
        if (data && data.qrCode) {
          setGeneratedQRCode(data.qrCode);
          setIsGenerateQROpen(false);
          toast({
            title: "QR Code Generated",
            description: "Share this QR code with your students to mark attendance.",
          });
        } else {
          toast({
            title: "Error",
            description: "QR code data was not returned properly. Please try again.",
            variant: "destructive",
          });
        }
      }).catch(err => {
        console.error("Error parsing QR code response:", err);
        toast({
          title: "Error",
          description: "Failed to process QR code response. Please try again.",
          variant: "destructive",
        });
      });
    },
    onError: (error) => {
      console.error("QR code generation error:", error);
      
      // Special handling for auth errors
      if (String(error).includes("401") || String(error).includes("authenticated")) {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Attempting to re-authenticate...",
          variant: "destructive",
        });
        
        // Try to establish a new development session
        fetch('/api/auth/dev-session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }).then(() => {
          toast({
            title: "Re-authenticated",
            description: "Please try generating the QR code again.",
          });
        }).catch(err => {
          console.error("Failed to re-authenticate:", err);
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to generate QR code: ${error}`,
          variant: "destructive",
        });
      }
    },
  });

  // Mark attendance manually mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async (data: any) => {
      // Try to refresh auth before making the request if no user ID
      try {
        if (!user?.id) {
          console.log("No user ID found for manual attendance, attempting to establish development session...");
          // Try to establish a development session
          await fetch('/api/auth/dev-session', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (authError) {
        console.error("Failed to refresh auth for manual attendance:", authError);
      }
      
      return apiRequest('POST', '/api/protected/attendance', {
        facultyId: user?.id || 1, // Fallback to default faculty ID if needed
        subjectId: parseInt(data.subjectId),
        studentId: parseInt(data.studentId),
        date: new Date(data.date),
        status: data.status,
        dev: true, // Additional parameter for development auth
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      setIsManualMarkingOpen(false);
      toast({
        title: "Attendance Marked",
        description: "The attendance has been recorded successfully.",
      });
    },
    onError: (error) => {
      console.error("Manual attendance error:", error);
      
      // Special handling for auth errors
      if (String(error).includes("401") || String(error).includes("authenticated")) {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Attempting to re-authenticate...",
          variant: "destructive",
        });
        
        // Try to establish a new development session
        fetch('/api/auth/dev-session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }).then(() => {
          toast({
            title: "Re-authenticated",
            description: "Please try marking attendance again.",
          });
        }).catch(err => {
          console.error("Failed to re-authenticate for manual attendance:", err);
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to mark attendance: ${error}`,
          variant: "destructive",
        });
      }
    },
  });

  // Forms
  const qrForm = useForm<z.infer<typeof generateQRSchema>>({
    resolver: zodResolver(generateQRSchema),
    defaultValues: {
      subjectId: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const manualForm = useForm({
    defaultValues: {
      subjectId: "",
      studentId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      status: true,
    },
  });

  const onSubmitGenerateQR = (data: z.infer<typeof generateQRSchema>) => {
    generateQRMutation.mutate(data);
  };

  const onSubmitManualMarking = (data: any) => {
    markAttendanceMutation.mutate(data);
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">Attendance Management</h2>
          <p className="text-neutral-600">Mark and manage student attendance.</p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setIsManualMarkingOpen(true)}>
            <span className="material-icons mr-2">edit</span>
            Mark Manually
          </Button>
          <Button onClick={() => setIsGenerateQROpen(true)}>
            <span className="material-icons mr-2">qr_code</span>
            Generate QR Code
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div className="w-64">
                <Select onValueChange={(value) => setSelectedSubject(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingCourses ? (
                      <SelectItem value="loading" disabled>Loading subjects...</SelectItem>
                    ) : coursesData?.subjects?.length > 0 ? (
                      coursesData.subjects.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.code} - {subject.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No subjects available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAttendance || !selectedSubject ? (
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
                  ) : attendanceData?.records?.length > 0 ? (
                    attendanceData.records.map((record: any) => {
                      const student = studentsData?.users?.find(
                        (s: any) => s.id === record.studentId
                      );
                      return (
                        <TableRow key={record.id}>
                          <TableCell>{format(new Date(record.date), 'PPP')}</TableCell>
                          <TableCell>
                            {student 
                              ? `${student.firstName} ${student.lastName}` 
                              : `Student ID: ${record.studentId}`}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {record.status ? 'Present' : 'Absent'}
                            </span>
                          </TableCell>
                          <TableCell>{record.qrCode ? 'QR Code' : 'Manual'}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-neutral-500">
                        {selectedSubject 
                          ? 'No attendance records found for this subject' 
                          : 'Select a subject to view attendance records'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Quick Attendance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {generatedQRCode ? (
              <>
                <QRCode qrData={generatedQRCode} size={180} />
                <p className="text-sm text-neutral-600 mt-2 text-center">
                  Share this QR code with your students
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => setGeneratedQRCode(null)}
                >
                  Clear QR Code
                </Button>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <span className="material-icons text-4xl text-neutral-400 mb-2">qr_code</span>
                  <h3 className="font-medium text-lg mb-1">No QR Code Generated</h3>
                  <p className="text-neutral-600 text-sm">
                    Generate a QR code for students to scan and mark their attendance.
                  </p>
                </div>
                <Button onClick={() => setIsGenerateQROpen(true)}>
                  <span className="material-icons mr-2">qr_code</span>
                  Generate QR Code
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Tabs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Attendance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="summary">
            <TabsList className="mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <div className="rounded-md border p-4">
                <p className="text-center text-neutral-600">
                  Select a subject to view attendance summary
                </p>
                {/* Implement attendance summary here */}
              </div>
            </TabsContent>

            <TabsContent value="students">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingStudents ? (
                      Array(5).fill(0).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="h-4 bg-neutral-200 rounded w-40 animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-neutral-200 rounded w-20 animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-neutral-200 rounded w-32 animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-neutral-200 rounded w-16 animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-neutral-200 rounded w-24 animate-pulse"></div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : studentsData?.users?.length > 0 ? (
                      studentsData.users.map((student: any) => (
                        <TableRow key={student.id}>
                          <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                          <TableCell>{student.collegeId}</TableCell>
                          <TableCell>{student.department}</TableCell>
                          <TableCell>{student.year}</TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                manualForm.setValue('studentId', student.id.toString());
                                setIsManualMarkingOpen(true);
                              }}
                            >
                              Mark Attendance
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-neutral-500">
                          No students found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Generate QR Code Dialog */}
      <Dialog open={isGenerateQROpen} onOpenChange={setIsGenerateQROpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Attendance QR Code</DialogTitle>
          </DialogHeader>
          <Form {...qrForm}>
            <form onSubmit={qrForm.handleSubmit(onSubmitGenerateQR)} className="space-y-4">
              <FormField
                control={qrForm.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {coursesData?.subjects?.length > 0 ? 
                          coursesData.subjects.map((subject: any) => (
                            <SelectItem key={subject.id} value={subject.id.toString()}>
                              {subject.code} - {subject.name}
                            </SelectItem>
                          )) : 
                          <SelectItem value="no-subjects">No subjects available</SelectItem>
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={qrForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setIsGenerateQROpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={generateQRMutation.isPending}
                >
                  {generateQRMutation.isPending ? "Generating..." : "Generate QR Code"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Manual Marking Dialog */}
      <Dialog open={isManualMarkingOpen} onOpenChange={setIsManualMarkingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Attendance Manually</DialogTitle>
          </DialogHeader>
          <form onSubmit={manualForm.handleSubmit(onSubmitManualMarking)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subjectId">Subject</Label>
              <Select 
                onValueChange={(value) => manualForm.setValue('subjectId', value)} 
                defaultValue={manualForm.getValues().subjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {coursesData?.subjects?.length > 0 ? 
                    coursesData.subjects.map((subject: any) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.code} - {subject.name}
                      </SelectItem>
                    )) : 
                    <SelectItem value="no-subjects">No subjects available</SelectItem>
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentId">Student</Label>
              <Select 
                onValueChange={(value) => manualForm.setValue('studentId', value)}
                defaultValue={manualForm.getValues().studentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  {studentsData?.users?.length > 0 ? 
                    studentsData.users.map((student: any) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.firstName} {student.lastName} ({student.collegeId})
                      </SelectItem>
                    )) : 
                    <SelectItem value="no-students">No students available</SelectItem>
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date" 
                type="date" 
                value={manualForm.getValues().date}
                onChange={(e) => manualForm.setValue('date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                onValueChange={(value) => manualForm.setValue('status', value === 'present')}
                defaultValue={manualForm.getValues().status ? 'present' : 'absent'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => setIsManualMarkingOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={markAttendanceMutation.isPending}
              >
                {markAttendanceMutation.isPending ? "Saving..." : "Mark Attendance"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
