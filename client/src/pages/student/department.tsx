import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { departments, years } from "@/lib/utils";

export default function StudentDepartment() {
  const [, navigate] = useLocation();

  // Fetch departments
  const { data: departmentsData, isLoading } = useQuery({
    queryKey: ['/api/departments'],
  });

  const selectDepartmentAndYear = (departmentId: string, year: string) => {
    navigate(`/student/department/${departmentId}/year/${year}/subjects`);
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">Departments</h2>
        <p className="text-neutral-600">Select your department and year to view subjects.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeletons
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-neutral-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-neutral-200 rounded w-full mb-6"></div>
                <div className="space-y-2">
                  {Array(4).fill(0).map((_, j) => (
                    <div key={j} className="h-10 bg-neutral-200 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          departmentsData?.departments?.map((department: any) => (
            <Card key={department.id} className="overflow-hidden">
              <div className="h-2 bg-primary"></div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2">{department.name}</h3>
                <p className="text-sm text-neutral-600 mb-4">{department.description}</p>
                
                <div className="space-y-2">
                  {years.map((year) => (
                    <Button
                      key={year.value}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => selectDepartmentAndYear(department.id.toString(), year.value)}
                    >
                      <span className="material-icons mr-2 text-primary">school</span>
                      {year.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
