import { Timestamp } from 'firebase/firestore';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  type: 'general' | 'event';
  date?: Date;
  imageUrl?: string;
  attachments?: string[];
  links?: { label: string; url: string; }[];
  updatedAt?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  department?: string;
  availability?: {
    [key: string]: {
      startTime: string;
      endTime: string;
    }[];
  };
  createdAt: Date;
  updatedAt?: Date;
}

export interface Appointment {
  id: string;
  facultyId: string;
  studentIds: string[];
  date: Date;
  startTime: string;
  endTime: string;
  meetingType: 'online' | 'physical';
  meetingLink?: string;
  facilityId?: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: Date;
  createdBy: string;
  createdByRole: 'faculty' | 'student';
  updatedAt?: Date;
  updatedBy?: string;
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  capacity: number;
  building: string;
  floor: number;
  roomNumber: string;
  amenities: string[];
  availability?: {
    [key: string]: {
      startTime: string;
      endTime: string;
    }[];
  };
  createdAt: Date;
  updatedAt?: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'update' | 'success' | 'error';
  read: boolean;
  relatedId?: string;
  createdAt: Date;
}
