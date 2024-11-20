import { CustomUser } from '../services/authService';

export const hasPermission = (user: CustomUser | null, requiredRole: 'student' | 'lecturer' | 'admin'): boolean => {
  if (!user || !user.role) return false;
  return user.role === requiredRole;
};
export {}; 
