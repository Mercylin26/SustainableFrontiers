import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/use-auth";
import { AuthProvider } from "./contexts/auth-context";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import StudentDashboard from "@/pages/student/dashboard";
import StudentDepartment from "@/pages/student/department";
import StudentSubjects from "@/pages/student/subjects";
import StudentAttendance from "@/pages/student/attendance";
import StudentEvents from "@/pages/student/events";
import FacultyDashboard from "@/pages/faculty/dashboard";
import FacultyCourses from "@/pages/faculty/courses";
import FacultyTimetable from "@/pages/faculty/timetable";
import FacultyEvents from "@/pages/faculty/events";
import FacultyAttendance from "@/pages/faculty/attendance";
import About from "@/pages/about";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { useEffect } from "react";

function Router() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user && location !== "/login" && location !== "/signup" && location !== "/about") {
      setLocation("/login");
    }
  }, [user, loading, location, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/about" component={About} />
      
      {/* Student Routes */}
      <Route path="/student/dashboard">
        {user && user.role === "student" ? <AppLayout><StudentDashboard /></AppLayout> : <Redirect to="/login" />}
      </Route>
      <Route path="/student/department">
        {user && user.role === "student" ? <AppLayout><StudentDepartment /></AppLayout> : <Redirect to="/login" />}
      </Route>
      <Route path="/student/department/:departmentId/year/:year/subjects">
        {user && user.role === "student" ? <AppLayout><StudentSubjects /></AppLayout> : <Redirect to="/login" />}
      </Route>
      <Route path="/student/attendance">
        {user && user.role === "student" ? <AppLayout><StudentAttendance /></AppLayout> : <Redirect to="/login" />}
      </Route>
      <Route path="/student/events">
        {user && user.role === "student" ? <AppLayout><StudentEvents /></AppLayout> : <Redirect to="/login" />}
      </Route>
      
      {/* Faculty Routes */}
      <Route path="/faculty/dashboard">
        {user && user.role === "faculty" ? <AppLayout><FacultyDashboard /></AppLayout> : <Redirect to="/login" />}
      </Route>
      <Route path="/faculty/courses">
        {user && user.role === "faculty" ? <AppLayout><FacultyCourses /></AppLayout> : <Redirect to="/login" />}
      </Route>
      <Route path="/faculty/timetable">
        {user && user.role === "faculty" ? <AppLayout><FacultyTimetable /></AppLayout> : <Redirect to="/login" />}
      </Route>
      <Route path="/faculty/events">
        {user && user.role === "faculty" ? <AppLayout><FacultyEvents /></AppLayout> : <Redirect to="/login" />}
      </Route>
      <Route path="/faculty/attendance">
        {user && user.role === "faculty" ? <AppLayout><FacultyAttendance /></AppLayout> : <Redirect to="/login" />}
      </Route>
      
      {/* Home Route */}
      <Route path="/">
        {user ? (
          user.role === "student" ? (
            <Redirect to="/student/dashboard" />
          ) : (
            <Redirect to="/faculty/dashboard" />
          )
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
