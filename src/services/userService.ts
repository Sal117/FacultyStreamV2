import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty';
  department?: string;
  phoneNumber?: string;
  address?: string;
  DOB?: string;
  profilePicture?: string;
  availability?: {
    [key: string]: string[]; // day: available times
  };
}

class UserService {
  private usersCollection = collection(db, 'users');

  async getAllUsers(): Promise<User[]> {
    try {
      const snapshot = await getDocs(this.usersCollection);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  async getFacultyMembers(): Promise<User[]> {
    try {
      const facultyQuery = query(this.usersCollection, where('role', '==', 'faculty'));
      const snapshot = await getDocs(facultyQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
    } catch (error) {
      console.error('Error fetching faculty members:', error);
      return [];
    }
  }

  async getStudents(): Promise<User[]> {
    try {
      const studentsQuery = query(this.usersCollection, where('role', '==', 'student'));
      const snapshot = await getDocs(studentsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      if (!userId) {
        console.error('No userId provided to getUserById');
        return null;
      }

      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.error('User document does not exist:', userId);
        return null;
      }
      
      const userData = userDoc.data();
      return {
        id: userDoc.id,
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'student',
        department: userData.department,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        DOB: userData.DOB,
        profilePicture: userData.profilePicture,
        availability: userData.availability
      };
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }
}

export const userService = new UserService();
