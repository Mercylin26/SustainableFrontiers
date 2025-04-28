import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { getInitials, calculateAttendanceStatus } from "@/lib/utils";

interface ProfileCardProps {
  user: any;
}

export default function ProfileCard({ user }: ProfileCardProps) {
  if (!user) {
    return (
      <div className="p-4 bg-neutral-100 rounded-lg animate-pulse">
        <div className="w-20 h-20 mx-auto rounded-full bg-neutral-200 mb-2"></div>
        <div className="h-5 bg-neutral-200 rounded w-3/4 mx-auto mb-2"></div>
        <div className="h-4 bg-neutral-200 rounded w-1/2 mx-auto mb-1"></div>
        <div className="h-4 bg-neutral-200 rounded w-1/3 mx-auto mb-2"></div>
        <div className="mt-2 bg-white rounded p-2 shadow-sm">
          <div className="h-3 bg-neutral-200 rounded w-1/2 mx-auto mb-1"></div>
          <div className="w-full bg-neutral-200 rounded-full h-2.5 mt-1"></div>
          <div className="h-3 bg-neutral-200 rounded w-1/4 mx-auto mt-1"></div>
        </div>
      </div>
    );
  }

  // For demo, we're setting a hardcoded attendance value
  // In real app, this would come from the user data or calculated from attendance records
  const attendancePercentage = user.role === "student" ? 85 : null;
  const status = attendancePercentage ? calculateAttendanceStatus(attendancePercentage) : null;
  
  const statusColors = {
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-error",
  };

  return (
    <div className="p-4 bg-neutral-100 rounded-lg">
      <div className="w-20 h-20 mx-auto rounded-full bg-primary overflow-hidden mb-2">
        {user.profilePicture ? (
          <Avatar className="w-full h-full">
            <AvatarImage src={user.profilePicture} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback className="bg-primary text-white">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold text-xl">
            {getInitials(user.firstName, user.lastName)}
          </div>
        )}
      </div>
      <h3 className="font-medium text-neutral-800 text-center">{`${user.firstName} ${user.lastName}`}</h3>
      <p className="text-sm text-neutral-600 mb-1 text-center">
        {departments[user.department as keyof typeof departments] || user.department}
      </p>
      {user.role === "student" && (
        <p className="text-sm text-neutral-600 text-center">{getYearLabel(user.year)}</p>
      )}
      {user.role === "faculty" && (
        <p className="text-sm text-neutral-600 text-center">{getPositionLabel(user.position)}</p>
      )}
      
      {user.role === "student" && attendancePercentage !== null && (
        <div className="mt-2 bg-white rounded p-2 shadow-sm">
          <p className="text-xs text-neutral-600">Attendance</p>
          <div className="w-full bg-neutral-200 rounded-full h-2.5 mt-1">
            <div 
              className={`h-2.5 rounded-full ${status ? statusColors[status] : "bg-success"}`} 
              style={{ width: `${attendancePercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-right mt-1 font-medium">{attendancePercentage}%</p>
        </div>
      )}
    </div>
  );
}

// Helper functions for displaying department, year, and position labels
const departments = {
  "cse": "Computer Science & Engineering",
  "ece": "Electronics & Communication",
  "eee": "Electrical & Electronics",
  "me": "Mechanical Engineering",
  "ce": "Civil Engineering",
  "ai": "Artificial Intelligence",
};

function getYearLabel(year: string): string {
  switch (year) {
    case "1": return "1st Year";
    case "2": return "2nd Year";
    case "3": return "3rd Year";
    case "4": return "4th Year";
    default: return `${year}th Year`;
  }
}

function getPositionLabel(position: string): string {
  switch (position) {
    case "professor": return "Professor";
    case "associate_professor": return "Associate Professor";
    case "assistant_professor": return "Assistant Professor";
    case "lecturer": return "Lecturer";
    default: return position;
  }
}
