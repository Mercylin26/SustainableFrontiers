import { createContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { 
  auth, 
  loginWithEmailAndPassword, 
  registerWithEmailAndPassword, 
  logoutUser 
} from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

// Define a custom user interface that extends FirebaseUser
interface CustomUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: "student" | "faculty";
  firstName: string;
  lastName: string;
  department?: string;
  year?: string;
  position?: string;
  collegeId?: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (userData: any) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch user data from our database if available
          try {
            const response = await fetch(`/api/users?email=${firebaseUser.email}`);
            const data = await response.json();
            
            if (response.ok && data.users && data.users.length > 0) {
              // Use the database user data to create a custom user
              const dbUser = data.users[0];
              
              const customUser: CustomUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                role: dbUser.role,
                firstName: dbUser.firstName,
                lastName: dbUser.lastName,
                department: dbUser.department,
                year: dbUser.year,
                position: dbUser.position,
                collegeId: dbUser.collegeId,
                profilePicture: dbUser.profilePicture
              };
              
              setUser(customUser);
            } else {
              // Fallback to basic info if user not found in database
              const customUser: CustomUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                role: "student", // Default role
                firstName: firebaseUser.displayName?.split(' ')[0] || "User",
                lastName: firebaseUser.displayName?.split(' ')[1] || "",
                department: "cse", // Default department
                year: "1",
                collegeId: `STU${Math.floor(1000 + Math.random() * 9000)}`
              };
              
              setUser(customUser);
            }
          } catch (dbError) {
            console.error("Error fetching user data from database:", dbError);
            
            // Fallback to basic info if database fetch fails
            const customUser: CustomUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: "student", // Default role
              firstName: firebaseUser.displayName?.split(' ')[0] || "User",
              lastName: firebaseUser.displayName?.split(' ')[1] || "",
              department: "cse", // Default department
              year: "1",
              collegeId: `STU${Math.floor(1000 + Math.random() * 9000)}`
            };
            
            setUser(customUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error handling auth state change:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // First, authenticate with Firebase
      const result = await loginWithEmailAndPassword(email, password);
      
      if (result.error) {
        toast({
          title: "Login Failed",
          description: result.error,
          variant: "destructive",
        });
        return { error: result.error };
      }
      
      // Then fetch the user data from our backend database
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          // Continue with Firebase login if database login fails
          console.error("Failed to fetch user details from database:", data.error);
        } else {
          // Enhance the custom user with data from our database
          const dbUser = data.user;
          
          if (dbUser && result.user) {
            // Update the user state with database details
            const customUser: CustomUser = {
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              role: dbUser.role,
              firstName: dbUser.firstName,
              lastName: dbUser.lastName,
              department: dbUser.department,
              year: dbUser.year,
              position: dbUser.position,
              collegeId: dbUser.collegeId,
              profilePicture: dbUser.profilePicture
            };
            
            setUser(customUser);
          }
        }
      } catch (dbError) {
        // Continue with Firebase login if database login fails
        console.error("Failed to fetch user details from database:", dbError);
      }
      
      toast({
        title: "Login Successful",
        description: `Welcome back!`,
      });
      
      return {};
    } catch (error: any) {
      console.error("Login error:", error);
      return { error: error.message || "Login failed. Please try again." };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: any) => {
    try {
      setLoading(true);
      
      const { email, password, firstName, lastName, role, collegeId, department, year, position } = userData;
      const displayName = `${firstName} ${lastName}`;
      
      // First, register with Firebase
      const result = await registerWithEmailAndPassword(email, password, displayName);
      
      if (result.error) {
        toast({
          title: "Registration Failed",
          description: result.error,
          variant: "destructive",
        });
        return { error: result.error };
      }
      
      // Then save the user data to our backend database
      try {
        // Convert the userData to match the schema required by the API
        const userDataForDB = {
          email,
          password,
          firstName,
          lastName,
          collegeId,
          role,
          department,
          year: role === "student" ? year : null,
          position: role === "faculty" ? position : null,
          profilePicture: null
        };
        
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userDataForDB),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to save user data to database');
        }
      } catch (dbError: any) {
        // If database storage fails, continue with Firebase auth but log the error
        console.error("Failed to save user to database:", dbError);
      }
      
      toast({
        title: "Registration Successful",
        description: `Welcome, ${firstName}!`,
      });
      
      return {};
    } catch (error: any) {
      console.error("Registration error:", error);
      return { error: error.message || "Registration failed. Please try again." };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      const result = await logoutUser();
      
      if (result.error) {
        toast({
          title: "Logout Failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      
      navigate("/login");
      
      toast({
        title: "Logout Successful",
        description: "You have been logged out successfully.",
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
