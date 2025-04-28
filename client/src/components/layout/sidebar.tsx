import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import ProfileCard from "@/components/profile-card";

const StudentNavItems = [
  { href: "/student/dashboard", icon: "home", label: "Home" },
  { href: "/student/department", icon: "business", label: "Department" },
  { href: "/student/events", icon: "event", label: "Events" },
  { href: "/student/attendance", icon: "assignment_turned_in", label: "Attendance" },
  { href: "/about", icon: "info", label: "About Us" },
];

const FacultyNavItems = [
  { href: "/faculty/dashboard", icon: "home", label: "Home" },
  { href: "/faculty/courses", icon: "book", label: "Courses" },
  { href: "/faculty/timetable", icon: "schedule", label: "Timetable" },
  { href: "/faculty/events", icon: "event", label: "Events" },
  { href: "/faculty/attendance", icon: "assignment_turned_in", label: "Attendance" },
  { href: "/about", icon: "info", label: "About Us" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = user?.role === "faculty" ? FacultyNavItems : StudentNavItems;

  return (
    <aside className="w-64 h-full bg-white shadow-md hidden md:flex md:flex-col">
      <div className="p-5 border-b border-neutral-200">
        <h1 className="text-xl font-bold text-primary flex items-center">
          <span className="material-icons mr-2">school</span>
          CollegeConnect
        </h1>
      </div>
      
      <div className="p-4 flex-grow">
        <div className="mb-4 text-center">
          <ProfileCard user={user} />
        </div>
        
        <nav className="mt-6">
          <ul>
            {navItems.map((item) => (
              <li key={item.href} className="mb-1">
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center p-3 rounded-md text-neutral-700 hover:text-primary hover:bg-neutral-100 transition-colors",
                      location === item.href && "bg-primary bg-opacity-10 text-primary border-l-4 border-primary"
                    )}
                  >
                    <span className="material-icons mr-3">{item.icon}</span>
                    {item.label}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      <div className="p-4 border-t border-neutral-200">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-neutral-700 hover:text-error"
          onClick={logout}
        >
          <span className="material-icons mr-3">logout</span>
          Logout
        </Button>
      </div>
    </aside>
  );
}
