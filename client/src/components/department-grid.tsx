import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

type Department = {
  id: number;
  name: string;
  code: string;
  description: string | null;
};

const DEPARTMENT_CATEGORIES = [
  { id: 'engineering', name: 'Engineering' },
  { id: 'sciences', name: 'Sciences' },
  { id: 'humanities', name: 'Humanities' },
  { id: 'business', name: 'Business' },
  { id: 'arts', name: 'Arts' }
];

// List of expanded departments for each category
const EXPANDED_DEPARTMENTS = {
  engineering: [
    { id: 101, name: 'Computer Science', code: 'CS', description: 'Study of algorithms, programming languages, and computation' },
    { id: 102, name: 'Mechanical Engineering', code: 'ME', description: 'Design and analysis of mechanical systems' },
    { id: 103, name: 'Civil Engineering', code: 'CE', description: 'Design and construction of infrastructure' },
    { id: 104, name: 'Electrical Engineering', code: 'EE', description: 'Study of electricity, electronics, and electromagnetism' },
  ],
  sciences: [
    { id: 201, name: 'Physics', code: 'PHY', description: 'Study of matter, energy, and the fundamental forces of nature' },
    { id: 202, name: 'Chemistry', code: 'CHEM', description: 'Study of matter, its properties, and interactions' },
    { id: 203, name: 'Biology', code: 'BIO', description: 'Study of living organisms and their interactions' },
  ],
  humanities: [
    { id: 301, name: 'Literature', code: 'LIT', description: 'Study of written works of art' },
    { id: 302, name: 'Philosophy', code: 'PHIL', description: 'Study of fundamental questions about existence, knowledge, values, reason, and language' },
    { id: 303, name: 'History', code: 'HIST', description: 'Study of past events' },
  ],
  business: [
    { id: 401, name: 'Marketing', code: 'MKT', description: 'Study of promoting and selling products or services' },
    { id: 402, name: 'Finance', code: 'FIN', description: 'Study of money and capital management' },
    { id: 403, name: 'Management', code: 'MGT', description: 'Study of organizational leadership and administration' },
  ],
  arts: [
    { id: 501, name: 'Fine Arts', code: 'ART', description: 'Study of visual arts, including painting, sculpture, and drawing' },
    { id: 502, name: 'Music', code: 'MUS', description: 'Study of sound and musical composition' },
    { id: 503, name: 'Theater', code: 'THTR', description: 'Study of dramatic arts and performance' },
  ]
};

export function DepartmentCard({ department }: { department: Department }) {
  return (
    <Card className="department-card h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{department.name}</CardTitle>
          <Badge>{department.code}</Badge>
        </div>
        <CardDescription className="line-clamp-2 min-h-[40px]">
          {department.description || "No description available"}
        </CardDescription>
      </CardHeader>
      <CardFooter className="pt-2">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/student/department/${department.id}/overview`}>
            View Department
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function DepartmentSkeleton() {
  return (
    <div className="department-card h-full">
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-10" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-9 w-full mt-4" />
      </div>
    </div>
  );
}

export default function DepartmentGrid() {
  const { data: dbDepartments, isLoading } = useQuery({
    queryKey: ['/api/departments'],
    select: (data: any) => data.departments as Department[]
  });

  return (
    <div className="w-full">
      <Tabs defaultValue="database">
        <TabsList className="mb-4">
          <TabsTrigger value="database">Current Departments</TabsTrigger>
          <TabsTrigger value="expanded">Expanded Departments</TabsTrigger>
        </TabsList>
        
        {/* Current departments from database */}
        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <DepartmentSkeleton key={i} />
              ))
            ) : dbDepartments?.length ? (
              dbDepartments.map(department => (
                <DepartmentCard key={department.id} department={department} />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No departments found</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Expanded departments showcase */}
        <TabsContent value="expanded" className="space-y-6">
          {DEPARTMENT_CATEGORIES.map(category => (
            <div key={category.id} className="space-y-3">
              <h3 className="text-xl font-semibold">{category.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {EXPANDED_DEPARTMENTS[category.id as keyof typeof EXPANDED_DEPARTMENTS].map(dept => (
                  <DepartmentCard key={dept.id} department={dept} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}