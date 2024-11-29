import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty';
  department?: string;
  availability?: {
    [key: string]: string[]; // day: available times
  };
}

class UserService {
  private usersCollection = collection(db, 'users');

  async getAllUsers(): Promise<User[]> {
    const snapshot = await getDocs(this.usersCollection);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
  }

  async getFacultyMembers(): Promise<User[]> {
    const facultyQuery = query(this.usersCollection, where('role', '==', 'faculty'));
    const snapshot = await getDocs(facultyQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
  }

  async getStudents(): Promise<User[]> {
    const studentsQuery = query(this.usersCollection, where('role', '==', 'student'));
    const snapshot = await getDocs(studentsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return null;
      
      return {
        id: userDoc.id,
        ...userDoc.data()
      } as User;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }
}

export const userService = new UserService();
