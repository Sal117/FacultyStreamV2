export interface Appointment {
  id: string;
  appointmentId?: string; // Added for backward compatibility
  facultyId: string;
  studentIds: string[];
  primaryUserId?: string; // Added for backward compatibility
  secondaryUserId?: string; // Added for backward compatibility
  date: Date;
  startTime: string;
  endTime: string;
  meetingType: 'online' | 'physical';
  meetingLink?: string;
  facilityId?: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdBy: string;
  createdByRole: 'faculty' | 'student';
  createdByName?: string; // Added for createdByName parameter
  createdAt: Date;
  updatedAt?: Date;
  updatedBy?: string;
}

export type AppointmentPayload = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>;