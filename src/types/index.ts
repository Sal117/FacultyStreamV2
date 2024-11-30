import { Timestamp } from 'firebase/firestore';

export type AnnouncementType = 'announcement' | 'event' | 'general';

export interface Announcement {
  id: string;
  announcementId?: string;
  title: string;
  content: string;
  type: AnnouncementType;
  date: Date;
  createdAt: Date;
  createdBy: string;
  createdByUid?: string;
  createdByName: string;
  imageUrl?: string;
  attachments: string[];
  links: {
    title: string;
    url: string;
  }[];
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

export interface NotificationPayload {
  id: string;
  type: 'info' | 'alert' | 'update' | 'success' | 'error';
  message: string;
  timestamp: Date;
  recipientId?: string;
  read?: boolean;
  relatedFormId?: string;
  relatedAppointmentId?: string;
  relatedConversationId?: string;
}
