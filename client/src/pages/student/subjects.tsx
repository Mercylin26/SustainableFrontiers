import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubjectCard from "@/components/ui/subject-card";
import Timetable from "@/components/timetable";

export default function StudentSubjects() {
  const params = useParams<{ departmentId: string; year: string }>();
  const [, navigate] = useLocation();
  
  const departmentId = parseInt(params.departmentId);
  const year = params.year;
  
  // Fetch department
  const { data: departmentData, isLoading: isLoadingDepartment } = useQuery({
    queryKey: ['/api/departments', departmentId],
    enabled: !!departmentId,
  });
  
  // Fetch subjects
  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['/api/subjects', { departmentId, year }],
    enabled: !!departmentId && !!year,
  });
  
  // Fetch attendance summary
  const { data: attendanceSummary, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['/api/attendance/summary/student'],
    enabled: true,
  });

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2" 
              onClick={() => navigate("/student/department")}
            >
              <span className="material-icons mr-1">arrow_back</span>
              Back
            </Button>
            <h2 className="text-2xl font-bold text-neutral-800">
              {isLoadingDepartment ? (
                <span className="animate-pulse bg-neutral-200 rounded h-8 w-40 inline-block"></span>
              ) : (
                departmentData?.department?.name
              )}
            </h2>
          </div>
          <p className="text-neutral-600">
            {isLoadingDepartment ? (
              <span className="animate-pulse bg-neutral-200 rounded h-5 w-60 inline-block"></span>
            ) : (
              `Viewing subjects for Year ${year}`
            )}
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="subjects" className="mb-6">
        <TabsList>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subjects">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingSubjects ? (
              Array(6).fill(0).map((_, i) => (
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
                  showViewDetailsButton
                />
              ))
            ) : (
              <div className="col-span-full flex justify-center items-center h-40">
                <Card>
                  <CardContent className="p-6 text-center">
                    <span className="material-icons text-4xl text-neutral-400 mb-2">search_off</span>
                    <h3 className="font-medium text-lg mb-1">No Subjects Found</h3>
                    <p className="text-neutral-600">No subjects are available for the selected department and year.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="timetable">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">Weekly Timetable</h3>
              <Timetable 
                showDaySelector
                entries={[]} // This would be populated from a query for weekly timetable
                isLoading={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
