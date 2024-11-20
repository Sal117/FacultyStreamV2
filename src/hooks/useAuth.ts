import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";  // Adjust the import path

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
// Custom hook for accessing authentication context easily anywhere in the app.
