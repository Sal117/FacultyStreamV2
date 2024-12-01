import { User as FirebaseUser } from 'firebase/auth';
import { User } from '../types';

export const convertFirebaseUser = (firebaseUser: FirebaseUser | null): User | null => {
  if (!firebaseUser) return null;
  
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'Unknown User',
    email: firebaseUser.email || '',
    role: 'faculty', // This should be fetched from your user profile in Firestore
    createdAt: new Date(),
  };
};

export const isAdmin = (user: FirebaseUser | null): boolean => {
  // Implement your admin check logic here
  // This could be based on a custom claim, role in Firestore, or specific email domains
  return user?.email?.endsWith('@admin.facultystream.com') || false;
};

export const isFaculty = (user: FirebaseUser | null): boolean => {
  // Implement your faculty check logic here
  return user?.email?.endsWith('@faculty.facultystream.com') || false;
};
