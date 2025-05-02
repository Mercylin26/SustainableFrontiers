import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Timetable from "@/components/timetable";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { daysOfWeek } from "@/lib/utils";

const timetableEntrySchema = z.object({
  subjectId: z.string().min(1, { message: "Subject is required" }),
  dayOfWeek: z.string().min(1, { message: "Day of week is required" }),
  startTime: z.string().min(1, { message: "Start time is required" }),
  endTime: z.string().min(1, { message: "End time is required" }),
  room: z.string().min(1, { message: "Room is required" }),
});

export default function FacultyTimetable() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(daysOfWeek[0]);

  // Fetch courses (subjects)
  const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/subjects', { facultyId: user?.id }],
    enabled: !!user,
  });

  // Fetch timetable entries
  const { data: timetableData, isLoading: isLoadingTimetable } = useQuery({
    queryKey: ['/api/timetable', { facultyId: user?.id }],
    enabled: !!user,
  });

  // Create timetable entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof timetableEntrySchema>) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      return apiRequest('POST', '/api/protected/timetable', {
        ...data,
        subjectId: parseInt(data.subjectId),
        facultyId: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timetable'] });
      setIsAddEntryOpen(false);
      toast({
        title: "Timetable Updated",
        description: "The timetable entry has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add timetable entry: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Form
  const form = useForm<z.infer<typeof timetableEntrySchema>>({
    resolver: zodResolver(timetableEntrySchema),
    defaultValues: {
      subjectId: "",
      dayOfWeek: "",
      startTime: "",
      endTime: "",
      room: "",
    },
  });

  const onSubmit = (data: z.infer<typeof timetableEntrySchema>) => {
    createEntryMutation.mutate(data);
  };

  // Filter entries by day
  const entriesByDay = timetableData?.entries?.reduce((acc: any, entry: any) => {
    if (!acc[entry.dayOfWeek]) {
      acc[entry.dayOfWeek] = [];
    }
    acc[entry.dayOfWeek].push(entry);
    return acc;
  }, {}) || {};

  // Format entries for display
  const formattedEntries = (entriesByDay[selectedDay] || []).map((entry: any) => {
    const subject = coursesData?.subjects?.find((s: any) => s.id === entry.subjectId);
    return {
      ...entry,
      subjectName: subject?.name || "Unknown Subject",
      subjectCode: subject?.code || "",
      instructorName: `Prof. ${user?.lastName || ""}`,
    };
  });

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">Timetable Management</h2>
          <p className="text-neutral-600">Manage your class schedule and timetable.</p>
        </div>
        <Button onClick={() => setIsAddEntryOpen(true)}>
          <span className="material-icons mr-2">add</span>
          Add Timetable Entry
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Weekly Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            {daysOfWeek.map((day) => (
              <Button
                key={day}
                variant={selectedDay === day ? "default" : "outline"}
                onClick={() => setSelectedDay(day)}
                className="flex-1"
              >
                {day.slice(0, 3)}
              </Button>
            ))}
          </div>

          <Timetable
            entries={formattedEntries}
            isLoading={isLoadingTimetable}
            isFaculty
          />
        </CardContent>
      </Card>

      {/* Add Timetable Entry Dialog */}
      <Dialog open={isAddEntryOpen} onOpenChange={setIsAddEntryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Timetable Entry</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                        {isLoadingCourses ? (
                          <SelectItem value="loading" disabled>Loading subjects...</SelectItem>
                        ) : coursesData?.subjects?.length > 0 ? (
                          coursesData.subjects.map((subject: any) => (
                            <SelectItem key={subject.id} value={subject.id.toString()}>
                              {subject.code} - {subject.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-subjects">No subjects available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day of Week</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 9:00 AM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 10:30 AM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="room"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Room 305" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => setIsAddEntryOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEntryMutation.isPending}>
                  {createEntryMutation.isPending ? "Saving..." : "Save Entry"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
