import { Button } from "@/components/ui/button";
import { calculateAttendanceStatus } from "@/lib/utils";
import { useParams, useLocation } from "wouter";

interface SubjectCardProps {
  subject: any;
  attendance: number;
  showViewDetailsButton?: boolean;
}

export default function SubjectCard({ 
  subject, 
  attendance, 
  showViewDetailsButton = false 
}: SubjectCardProps) {
  const [, navigate] = useLocation();
  
  const status = calculateAttendanceStatus(attendance);
  const statusIcons = {
    success: "check_circle",
    warning: "warning",
    error: "error",
  };
  
  const statusColors = {
    success: "text-success",
    warning: "text-warning",
    error: "text-error",
  };
  
  const subjectCodeColors = {
    CSE: "bg-primary-light bg-opacity-10 text-primary",
    MKT: "bg-accent-light bg-opacity-10 text-accent",
    ECE: "bg-secondary-light bg-opacity-10 text-secondary",
    EEE: "bg-warning bg-opacity-10 text-warning",
    ME: "bg-error bg-opacity-10 text-error",
    CE: "bg-success bg-opacity-10 text-success",
  };
  
  // Get the subject code prefix (CSE, MKT, etc.)
  const codePrefix = subject.code?.split('-')[0] || "CSE";
  const colorClass = subjectCodeColors[codePrefix as keyof typeof subjectCodeColors] || subjectCodeColors.CSE;
  
  return (
    <div className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between">
        <h4 className="font-medium text-neutral-800">{subject.name}</h4>
        <span className="material-icons text-primary text-sm">bookmark</span>
      </div>
      <p className="text-sm text-neutral-600 mb-3">
        {subject.facultyName || `Prof. ${subject.facultyId ? "Assigned" : "Not Assigned"}`}
      </p>
      <div className="flex items-center text-sm mb-3">
        <span className={`material-icons text-sm mr-1 ${statusColors[status]}`}>
          {statusIcons[status]}
        </span>
        <span className="text-neutral-600">
          Attendance: <span className="font-medium">{attendance}%</span>
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className={`inline-block px-2 py-1 text-xs rounded ${colorClass}`}>
          {subject.code}
        </span>
        {showViewDetailsButton && (
          <Button 
            variant="link" 
            size="sm" 
            className="text-primary p-0 h-auto"
            onClick={() => navigate(`/student/subjects/${subject.id}`)}
          >
            View Details
          </Button>
        )}
      </div>
    </div>
  );
}
