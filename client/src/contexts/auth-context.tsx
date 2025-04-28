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
          // For demo purposes, we'll create a custom user with role and other properties
          // In a real app, you would fetch this data from your database
          const customUser: CustomUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            // Default to student role, should be fetched from database in real app
            role: "student",
            firstName: firebaseUser.displayName?.split(' ')[0] || "User",
            lastName: firebaseUser.displayName?.split(' ')[1] || "",
            department: "cse",
            year: "1",
            collegeId: `STU${Math.floor(1000 + Math.random() * 9000)}`
          };
          
          // In a real implementation, you would fetch actual user data from your database
          // Example: const userData = await fetchUserProfile(firebaseUser.uid);
          
          setUser(customUser);
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
      
      const result = await loginWithEmailAndPassword(email, password);
      
      if (result.error) {
        toast({
          title: "Login Failed",
          description: result.error,
          variant: "destructive",
        });
        return { error: result.error };
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
      
      const { email, password, firstName, lastName, role } = userData;
      const displayName = `${firstName} ${lastName}`;
      
      const result = await registerWithEmailAndPassword(email, password, displayName);
      
      if (result.error) {
        toast({
          title: "Registration Failed",
          description: result.error,
          variant: "destructive",
        });
        return { error: result.error };
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
