import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "./sidebar";

export default function Header() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([
    { id: 1, title: "New Event", message: "Tech Symposium 2023 has been scheduled" },
    { id: 2, title: "Attendance Alert", message: "Your attendance in Data Structures is below 75%" }
  ]);

  return (
    <header className="bg-white shadow-sm">
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <span className="material-icons">menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar />
            </SheetContent>
          </Sheet>
          
          <h1 className="text-xl font-bold text-primary md:hidden flex items-center">
            <span className="material-icons mr-2">school</span>
            CollegeConnect
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button variant="ghost" size="icon" className="relative">
              <span className="material-icons">notifications</span>
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
              )}
            </Button>
          </div>
          
          <div className="md:hidden">
            {user && (
              <div className="w-8 h-8 rounded-full bg-primary overflow-hidden flex items-center justify-center text-white">
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={`${user.firstName} ${user.lastName}`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {user.firstName.charAt(0)}
                    {user.lastName.charAt(0)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
