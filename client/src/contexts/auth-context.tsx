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

  // Check if user is logged in
  useEffect(() => {
    // Try to listen for Firebase auth state changes
    let firebaseUnsubscribe = () => {};
    
    try {
      firebaseUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
                setLoading(false);
                return;
              }
            } catch (dbError) {
              console.error("Error fetching user data from database:", dbError);
            }
            
            // If we can't get user data from database but have Firebase user
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
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error handling Firebase auth state change:", error);
        }
        
        // If no Firebase user, check if we have any user data in storage
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser) as CustomUser;
            setUser(parsedUser);
            setLoading(false);
            return;
          }
        } catch (storageError) {
          console.error("Error reading from local storage:", storageError);
        }
        
        // If we get here, no user is logged in
        setUser(null);
        setLoading(false);
      });
    } catch (firebaseError) {
      console.error("Error setting up Firebase auth listener:", firebaseError);
      
      // Try to get user from localStorage if Firebase fails
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as CustomUser;
          setUser(parsedUser);
        } else {
          setUser(null);
        }
      } catch (storageError) {
        console.error("Error reading from local storage:", storageError);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    // Cleanup subscription
    return () => {
      try {
        firebaseUnsubscribe();
      } catch (error) {
        console.error("Error cleaning up Firebase auth listener:", error);
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // First, try to authenticate with the database
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
          throw new Error(data.error || 'Invalid email or password');
        }
        
        // Create a custom user from the database user
        const dbUser = data.user;
        
        if (dbUser) {
          const customUser: CustomUser = {
            uid: `local-${dbUser.id}`,
            email: dbUser.email,
            displayName: `${dbUser.firstName} ${dbUser.lastName}`,
            role: dbUser.role as "student" | "faculty",
            firstName: dbUser.firstName,
            lastName: dbUser.lastName,
            department: dbUser.department,
            year: dbUser.year,
            position: dbUser.position,
            collegeId: dbUser.collegeId,
            profilePicture: dbUser.profilePicture
          };
          
          // Save user to localStorage for persistence
          localStorage.setItem('user', JSON.stringify(customUser));
          
          setUser(customUser);
          
          // Try to also authenticate with Firebase (if available) in the background
          try {
            const firebaseResult = await loginWithEmailAndPassword(email, password);
            console.log("Firebase login result:", firebaseResult);
          } catch (firebaseError) {
            // Continue with database authentication if Firebase fails
            console.error("Firebase login failed, using database authentication only:", firebaseError);
          }
          
          toast({
            title: "Login Successful",
            description: `Welcome back, ${dbUser.firstName}!`,
          });
          
          return {};
        }
      } catch (dbError: any) {
        console.error("Database login failed:", dbError);
        
        // Fallback to Firebase authentication if database login fails
        try {
          const result = await loginWithEmailAndPassword(email, password);
          
          if (result.error) {
            throw new Error(result.error);
          }
          
          if (result.user) {
            // Create a basic user profile from Firebase user
            const customUser: CustomUser = {
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              role: "student", // Default role
              firstName: result.user.displayName?.split(' ')[0] || "User",
              lastName: result.user.displayName?.split(' ')[1] || "",
              department: "cse", // Default
              year: "1",
              collegeId: `STU${Math.floor(1000 + Math.random() * 9000)}`
            };
            
            setUser(customUser);
            
            toast({
              title: "Login Successful",
              description: `Welcome back!`,
            });
            
            return {};
          }
        } catch (firebaseError: any) {
          // Both authentication methods failed
          console.error("Both database and Firebase login failed:", firebaseError);
          throw new Error(dbError.message || firebaseError.message || "Login failed. Please try again.");
        }
      }
      
      throw new Error("Login failed. Please try again.");
    } catch (error: any) {
      console.error("Login error:", error);
      
      toast({
        title: "Login Failed",
        description: error.message || "Login failed. Please try again.",
        variant: "destructive",
      });
      
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
      
      // Save the user data to our backend database
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
        
        // Create a custom user object from the database response
        const customUser: CustomUser = {
          uid: `local-${data.user.id}`, // Generate a placeholder UID
          email: data.user.email,
          displayName: `${data.user.firstName} ${data.user.lastName}`,
          role: data.user.role as "student" | "faculty",
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          department: data.user.department,
          year: data.user.year,
          position: data.user.position,
          collegeId: data.user.collegeId,
          profilePicture: data.user.profilePicture
        };
        
        // Save user to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(customUser));
        
        // Set the user in state
        setUser(customUser);
        
        // Try to also register with Firebase (if available) in the background
        try {
          const firebaseResult = await registerWithEmailAndPassword(email, password, displayName);
          console.log("Firebase registration result:", firebaseResult);
        } catch (firebaseError) {
          // Continue without Firebase authentication if it fails
          console.error("Firebase registration failed, using database authentication only:", firebaseError);
        }
        
        toast({
          title: "Registration Successful",
          description: `Welcome, ${firstName}!`,
        });
        
        return {};
      } catch (dbError: any) {
        console.error("Failed to save user to database:", dbError);
        
        toast({
          title: "Registration Failed",
          description: dbError.message || "Failed to register. Please try again.",
          variant: "destructive",
        });
        
        return { error: dbError.message || "Registration failed. Please try again." };
      }
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
      
      // Clear user from state and from localStorage
      localStorage.removeItem('user');
      setUser(null);
      
      // Try to also logout from Firebase (if available)
      try {
        const result = await logoutUser();
        console.log("Firebase logout result:", result);
      } catch (error) {
        // Continue even if Firebase logout fails
        console.error("Firebase logout failed, but user session has been cleared:", error);
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
