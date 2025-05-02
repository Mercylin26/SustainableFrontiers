import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { years } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const courseFormSchema = z.object({
  code: z.string().min(2, { message: "Course code is required" }),
  name: z.string().min(2, { message: "Course name is required" }),
  departmentId: z.string().min(1, { message: "Department is required" }),
  year: z.string().min(1, { message: "Year is required" }),
  description: z.string().optional(),
});

export default function FacultyCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isUploadNotesOpen, setIsUploadNotesOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  // Fetch departments
  const { data: departmentsData } = useQuery({
    queryKey: ['/api/departments'],
  });

  // Fetch courses
  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['/api/subjects', { facultyId: user?.id }],
    enabled: !!user,
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof courseFormSchema>) => {
      if (!user) {
        throw new Error("User not authenticated");
      }
      console.log("Submitting with user:", user);
      
      // First check if session is valid
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        const authData = await response.json();
        console.log("Auth check response:", authData);
        
        // If not authenticated, try to establish session manually
        if (authData.error === "Not authenticated") {
          console.log("Attempting to establish session manually");
          
          const sessionResponse = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id }),
            credentials: 'include',
          });
          
          if (!sessionResponse.ok) {
            console.error("Failed to establish session:", await sessionResponse.json());
          } else {
            console.log("Session established successfully");
          }
        }
      } catch (err) {
        console.error("Failed to check auth status:", err);
      }
      
      return apiRequest('POST', '/api/protected/subjects', {
        ...data,
        departmentId: parseInt(data.departmentId)
        // facultyId is set automatically on the server
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
      setIsAddCourseOpen(false);
      toast({
        title: "Course Created",
        description: "The course has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create course: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Upload notes mutation
  const uploadNotesMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      if (!selectedCourse?.id) {
        throw new Error("No course selected");
      }
      return apiRequest('POST', '/api/protected/notes', {
        ...data,
        subjectId: selectedCourse.id,
        // facultyId is set automatically on the server
        uploadDate: new Date(),
      });
    },
    onSuccess: () => {
      setIsUploadNotesOpen(false);
      toast({
        title: "Notes Uploaded",
        description: "The notes have been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to upload notes: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Course form
  const form = useForm<z.infer<typeof courseFormSchema>>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      code: "",
      name: "",
      departmentId: "",
      year: "",
      description: "",
    },
  });

  // Notes form
  const notesForm = useForm({
    defaultValues: {
      title: "",
      content: "",
      fileUrl: "",
    },
  });

  const onSubmitCourse = (data: z.infer<typeof courseFormSchema>) => {
    createCourseMutation.mutate(data);
  };

  const onSubmitNotes = (data: any) => {
    uploadNotesMutation.mutate(data);
  };

  const handleUploadNotes = (course: any) => {
    setSelectedCourse(course);
    setIsUploadNotesOpen(true);
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">My Courses</h2>
          <p className="text-neutral-600">Manage your courses, syllabus, and notes.</p>
        </div>
        <Button onClick={() => setIsAddCourseOpen(true)}>
          <span className="material-icons mr-2">add</span>
          Add Course
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-neutral-100 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coursesData?.subjects?.length > 0 ? (
                    coursesData.subjects.map((course: any) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.code}</TableCell>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>
                          {departmentsData?.departments?.find((d: any) => d.id === course.departmentId)?.name || course.departmentId}
                        </TableCell>
                        <TableCell>
                          {years.find(y => y.value === course.year)?.label || course.year}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUploadNotes(course)}
                            >
                              <span className="material-icons text-sm mr-1">upload_file</span>
                              Upload Notes
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // View course details or edit
                              }}
                            >
                              <span className="material-icons text-sm">more_horiz</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-neutral-500">
                        No courses found. Click "Add Course" to create your first course.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Course Dialog */}
      <Dialog open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitCourse)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. CSE-301" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Computer Architecture" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departmentsData?.departments?.length > 0 ? 
                          departmentsData.departments.map((dept: any) => (
                            <SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>
                          )) : 
                          <SelectItem value="no-departments">No departments available</SelectItem>
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter course description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => setIsAddCourseOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCourseMutation.isPending}>
                  {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Upload Notes Dialog */}
      <Dialog open={isUploadNotesOpen} onOpenChange={setIsUploadNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Notes</DialogTitle>
          </DialogHeader>
          <form onSubmit={notesForm.handleSubmit(onSubmitNotes)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Chapter 1: Introduction"
                {...notesForm.register("title", { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (Optional)</Label>
              <Textarea
                id="content"
                placeholder="Add any additional notes or description"
                {...notesForm.register("content")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileUrl">File URL (Optional)</Label>
              <Input
                id="fileUrl"
                placeholder="https://example.com/notes.pdf"
                {...notesForm.register("fileUrl")}
              />
              <p className="text-xs text-neutral-500">
                Enter a URL to your uploaded file or leave empty to add content only.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => setIsUploadNotesOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploadNotesMutation.isPending}>
                {uploadNotesMutation.isPending ? "Uploading..." : "Upload Notes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
