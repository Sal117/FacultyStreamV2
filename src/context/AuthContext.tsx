import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authService, CustomUser } from "../services/authService";

interface AuthContextType {
  user: CustomUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changeUserPassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>; // Expose the updatePassword function
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  changeUserPassword: async () => {}, // Provide a dummy function for fallback
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(
      (user: CustomUser | null) => {
        setUser(user);
        setIsAuthenticated(!!user);
      }
    );
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const user = await authService.login(email, password);
    setUser(user);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const changeUserPassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (user) {
      await authService.changeUserPassword(currentPassword, newPassword);
    } else {
      console.error("User not authenticated");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, logout, changeUserPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
