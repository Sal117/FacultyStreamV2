//src/types/appointment.ts
import { Timestamp } from 'firebase/firestore';

export type AppointmentStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'confirmed';

export interface Appointment {
  id: string;
  facultyId: string;
  studentIds: string[];
  date: Date;
  startTime: string;
  endTime: string;
  meetingType: 'online' | 'physical';
  meetingLink: string | null;
  facilityId: string | null;
  notes?: string;
  status: AppointmentStatus;
  createdBy: string;
  createdByRole: 'student' | 'faculty';
  createdByName: string;
  createdAt: Date;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface FirestoreAppointment extends Omit<Appointment, 'date' | 'createdAt' | 'updatedAt'> {
  date: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface CalendarAppointment extends Appointment {
  title: string;
  start: Date;
  end: Date;
}