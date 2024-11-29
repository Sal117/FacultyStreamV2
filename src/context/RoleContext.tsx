import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext"; // Ensure this import is correct

// Define available role types
type UserRole = "student" | "faculty" | "admin" | "guest";

// Define the structure of RoleContextType
interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void; // Allow manual role setting if needed
}

// Create the Role Context with a default value of guest role
export const RoleContext = createContext<RoleContextType>({
  role: "guest", // Default role
  setRole: () => {}, // Default setter that does nothing
});

// Interface for the RoleProvider component's children prop
interface RoleProviderProps {
  children: ReactNode;
}

// RoleProvider component: manages and provides user role information
export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { user } = useAuth(); // Get the user data from AuthContext
  const [role, setRole] = useState<UserRole>("guest");

  useEffect(() => {
    // If the user is authenticated, update the role based on user data
    if (user) {
      setRole(user.role || "guest"); // Set role from user data or default to guest
    } else {
      setRole("guest"); // If no user is logged in, set the role as guest
    }
  }, [user]);

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children} {/* Provide the role and role setter to the app */}
    </RoleContext.Provider>
  );
};

// Custom hook to access the current user's role
export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context; // Return the role and the setRole function
};
