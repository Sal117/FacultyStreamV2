import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, Timestamp, orderBy, onSnapshot } from 'firebase/firestore';
import type { Appointment, FirestoreAppointment } from '../types/appointment';
import { notificationService } from './notificationService';
import { facilityService } from './facilityService';
import type { Notification } from '../types/notification';

type AppointmentStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

// Re-export the Appointment type
export type { Appointment } from '../types/appointment';

export class AppointmentService {
  private appointmentsRef = collection(db, 'appointments');

  // Convert Firestore data to Appointment type
  private convertFromFirestore(data: any, id: string): Appointment {
    return {
      id,
      facultyId: data.facultyId,
      studentIds: data.studentIds || [],
      date: data.date?.toDate() || new Date(),
      startTime: data.startTime,
      endTime: data.endTime,
      meetingType: data.meetingType,
      meetingLink: data.meetingLink || null,
      facilityId: data.facilityId || null,
      notes: data.notes,
      status: data.status,
      createdBy: data.createdBy,
      createdByRole: data.createdByRole,
      createdByName: data.createdByName,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate(),
      updatedBy: data.updatedBy
    };
  }

  // Convert Appointment type to Firestore data
  private convertToFirestore(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Omit<FirestoreAppointment, 'id'> {
    const now = Timestamp.now();
    return {
      ...appointmentData,
      date: Timestamp.fromDate(appointmentData.date),
      meetingLink: appointmentData.meetingLink || null,
      facilityId: appointmentData.facilityId || null,
      createdAt: now,
      updatedAt: now
    };
  }

  private async notifyUsers(recipientIds: string[], message: string, appointmentId: string) {
    for (const recipientId of recipientIds) {
      await notificationService.notify({
        recipientId,
        message,
        type: 'info',
        relatedAppointmentId: appointmentId
      });
    }
  }

  async isTimeSlotAvailable(
    facultyId: string,
    date: Date,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    try {
      // Convert date to start and end of day for query
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Query only by facultyId to avoid requiring composite index
      const q = query(
        this.appointmentsRef,
        where('facultyId', '==', facultyId)
      );

      const querySnapshot = await getDocs(q);
      const appointments = querySnapshot.docs.map(doc => 
        this.convertFromFirestore(doc.data(), doc.id)
      );

      // Filter appointments for the specific date in memory
      const sameDataAppointments = appointments.filter(appointment => {
        const appointmentDate = appointment.date;
        return appointmentDate >= startOfDay && appointmentDate <= endOfDay;
      });

      // Check for time slot conflicts
      const requestedStart = new Date(`${date.toDateString()} ${startTime}`);
      const requestedEnd = new Date(`${date.toDateString()} ${endTime}`);

      for (const appointment of sameDataAppointments) {
        if (appointment.status === 'rejected' || appointment.status === 'cancelled') {
          continue; // Skip rejected or cancelled appointments
        }

        const existingStart = new Date(`${appointment.date.toDateString()} ${appointment.startTime}`);
        const existingEnd = new Date(`${appointment.date.toDateString()} ${appointment.endTime}`);

        // Check if there's any overlap
        if (
          (requestedStart >= existingStart && requestedStart < existingEnd) || // New start time falls within existing appointment
          (requestedEnd > existingStart && requestedEnd <= existingEnd) || // New end time falls within existing appointment
          (requestedStart <= existingStart && requestedEnd >= existingEnd) // New appointment completely encompasses existing one
        ) {
          return false; // Time slot is not available
        }
      }

      return true; // No conflicts found
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      throw error;
    }
  }

  async createAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Check if the time slot is available
      const isAvailable = await this.isTimeSlotAvailable(
        appointmentData.facultyId,
        appointmentData.date,
        appointmentData.startTime,
        appointmentData.endTime
      );

      if (!isAvailable) {
        throw new Error('This time slot is not available with the selected faculty member.');
      }

      if (appointmentData.meetingType === 'physical' && appointmentData.facilityId) {
        const isFacilityAvailable = await facilityService.checkFacilityAvailability(
          appointmentData.facilityId,
          appointmentData.date,
          appointmentData.startTime,
          appointmentData.endTime
        );
        if (!isFacilityAvailable) {
          throw new Error('Facility is not available for the selected time slot');
        }
      }

      const now = Timestamp.now();
      const firestoreData = {
        ...appointmentData,
        date: Timestamp.fromDate(appointmentData.date),
        meetingLink: appointmentData.meetingLink || null,
        facilityId: appointmentData.facilityId || null,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(this.appointmentsRef, firestoreData);

      // Notify about new appointment
      const message = `New appointment scheduled for ${appointmentData.date.toLocaleDateString()} at ${appointmentData.startTime}`;
      await this.notifyUsers(
        [appointmentData.facultyId, ...appointmentData.studentIds],
        message,
        docRef.id
      );

      return docRef.id;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async getAppointment(appointmentId: string): Promise<Appointment | null> {
    try {
      const appointmentDoc = await getDoc(doc(this.appointmentsRef, appointmentId));
      if (!appointmentDoc.exists()) return null;
      
      return this.convertFromFirestore(appointmentDoc.data(), appointmentDoc.id);
    } catch (error) {
      console.error('Error getting appointment:', error);
      throw error;
    }
  }

  async getFacultyAppointments(facultyId: string): Promise<Appointment[]> {
    try {
      // Query only by facultyId to avoid requiring composite index
      const q = query(
        this.appointmentsRef,
        where('facultyId', '==', facultyId)
      );

      const querySnapshot = await getDocs(q);
      const appointments = querySnapshot.docs.map(doc => 
        this.convertFromFirestore(doc.data(), doc.id)
      );

      // Sort appointments by date in memory
      return appointments.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error getting faculty appointments:', error);
      throw error;
    }
  }

  async getStudentAppointments(studentId: string): Promise<Appointment[]> {
    try {
      // Query only by studentIds array to avoid requiring composite index
      const q = query(
        this.appointmentsRef,
        where('studentIds', 'array-contains', studentId)
      );

      const querySnapshot = await getDocs(q);
      const appointments = querySnapshot.docs.map(doc => 
        this.convertFromFirestore(doc.data(), doc.id)
      );

      // Sort appointments by date in memory
      return appointments.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error getting student appointments:', error);
      throw error;
    }
  }

  async getAppointmentsForUser(userId: string, startDate?: Date, endDate?: Date): Promise<Appointment[]> {
    try {
      let q = query(
        this.appointmentsRef,
        where('studentIds', 'array-contains', userId)
      );

      if (startDate) {
        q = query(q, where('date', '>=', startDate));
      }
      if (endDate) {
        q = query(q, where('date', '<=', endDate));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.convertFromFirestore(doc.data(), doc.id));
    } catch (error) {
      console.error('Error getting user appointments:', error);
      throw error;
    }
  }

  async getAppointmentsWithSecondaryUser(userId: string): Promise<Appointment[]> {
    try {
      const [asStudent, asFaculty] = await Promise.all([
        this.getStudentAppointments(userId),
        this.getFacultyAppointments(userId)
      ]);

      return [...asStudent, ...asFaculty].sort((a, b) => 
        b.date.getTime() - a.date.getTime()
      );
    } catch (error) {
      console.error('Error getting appointments with secondary user:', error);
      throw error;
    }
  }

  async addAppointmentWithSecondaryUser(
    appointmentData: {
      facultyId: string;
      studentIds: string[];
      date: Date;
      startTime: string;
      endTime: string;
      meetingType: 'online' | 'physical';
      meetingLink?: string;
      facilityId?: string;
      notes?: string;
      createdBy: string;
      createdByRole: 'faculty' | 'student';
    },
    createdByName: string
  ): Promise<Appointment> {
    try {
      if (appointmentData.meetingType === 'physical' && appointmentData.facilityId) {
        const isAvailable = await facilityService.checkFacilityAvailability(
          appointmentData.facilityId,
          appointmentData.date,
          appointmentData.startTime,
          appointmentData.endTime
        );

        if (!isAvailable) {
          throw new Error('Selected facility is not available');
        }
      }

      const status: AppointmentStatus = appointmentData.createdByRole === 'faculty' ? 'accepted' : 'pending';
      const appointmentToCreate = {
        ...appointmentData,
        status,
        createdByName,
        meetingLink: appointmentData.meetingLink || null,
        facilityId: appointmentData.facilityId || null
      };
      
      const appointmentId = await this.createAppointment(appointmentToCreate);

      const appointment = await this.getAppointment(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found after creation');
      }

      // Notify relevant users
      await notificationService.notify({
        message: `Your appointment request has been ${status}`,
        type: status === 'accepted' ? 'success' : 'error',
        recipientId: appointment.createdBy,
        relatedAppointmentId: appointmentId
      });

      // Notify faculty if student created
      if (appointment.createdByRole === 'student') {
        await notificationService.notify({
          message: `A student has requested an appointment for ${appointment.date}`,
          type: 'alert',
          recipientId: appointment.facultyId,
          relatedAppointmentId: appointmentId
        });
      }

      return appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    try {
      const appointmentDoc = await getDoc(doc(this.appointmentsRef, appointmentId));
      if (!appointmentDoc.exists()) return null;
      
      return this.convertFromFirestore(appointmentDoc.data(), appointmentId);
    } catch (error) {
      console.error('Error getting appointment by id:', error);
      throw error;
    }
  }

  async updateAppointmentStatus(
    appointmentId: string,
    newStatus: AppointmentStatus,
    updatedBy?: string
  ): Promise<void> {
    try {
      const appointment = await this.getAppointmentById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const docRef = doc(this.appointmentsRef, appointmentId);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
        ...(updatedBy && { updatedBy })
      });

      // Notify about status update
      const message = `Appointment for ${appointment.date.toLocaleDateString()} has been ${newStatus}`;
      await this.notifyUsers(
        [appointment.facultyId, ...appointment.studentIds],
        message,
        appointmentId
      );
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  }

  async rescheduleAppointment(
    appointmentId: string,
    newDate: Date,
    newStartTime: string,
    newEndTime: string
  ): Promise<void> {
    try {
      const appointment = await this.getAppointmentById(appointmentId);
      
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Check if the new time slot is available
      const isAvailable = await this.isTimeSlotAvailable(
        appointment.facultyId,
        newDate,
        newStartTime,
        newEndTime
      );

      if (!isAvailable) {
        throw new Error('The selected time slot is not available');
      }

      const docRef = doc(this.appointmentsRef, appointmentId);
      await updateDoc(docRef, {
        date: Timestamp.fromDate(newDate),
        startTime: newStartTime,
        endTime: newEndTime,
        updatedAt: Timestamp.now()
      });

      // Notify about rescheduling
      const message = `Appointment has been rescheduled to ${newDate.toLocaleDateString()} at ${newStartTime}`;
      await this.notifyUsers(
        [appointment.facultyId, ...appointment.studentIds],
        message,
        appointmentId
      );
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  }

  async cancelAppointment(appointmentId: string): Promise<void> {
    try {
      await this.updateAppointmentStatus(appointmentId, 'cancelled', 'system');
    } catch (error) {
      console.error('Error canceling appointment:', error);
      throw error;
    }
  }

  async deleteAppointment(appointmentId: string): Promise<void> {
    try {
      const docRef = doc(this.appointmentsRef, appointmentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Appointment not found');
      }

      const appointment = this.convertFromFirestore(docSnap.data(), appointmentId);
      await deleteDoc(docRef);

      // Notify users about deletion
      const notificationData = {
        message: `The appointment scheduled for ${appointment.date.toLocaleDateString()} has been deleted`,
        type: 'alert' as Notification['type'],
        relatedAppointmentId: appointmentId
      };

      // Notify faculty
      await notificationService.notify({
        ...notificationData,
        recipientId: appointment.facultyId
      });

      // Notify students
      for (const studentId of appointment.studentIds) {
        await notificationService.notify({
          ...notificationData,
          recipientId: studentId
        });
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  async getAppointmentsForFaculty(facultyId: string): Promise<Appointment[]> {
    try {
      // Query only by facultyId to avoid requiring composite index
      const q = query(
        this.appointmentsRef,
        where('facultyId', '==', facultyId)
      );
      const querySnapshot = await getDocs(q);
      const appointments = querySnapshot.docs.map(doc => 
        this.convertFromFirestore(doc.data(), doc.id)
      );

      // Sort appointments by date in memory
      return appointments.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error getting faculty appointments:', error);
      throw error;
    }
  }

  subscribeToFacultyAppointments(
    facultyId: string,
    callback: (appointments: Appointment[]) => void
  ): () => void {
    // Query only by facultyId to avoid requiring composite index
    const q = query(
      this.appointmentsRef,
      where('facultyId', '==', facultyId)
    );

    return onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs.map(doc => this.convertFromFirestore(doc.data(), doc.id));
      
      // Sort appointments by date in memory
      const sortedAppointments = appointments.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      callback(sortedAppointments);
    }, (error) => {
      console.error('Error in appointment subscription:', error);
    });
  }

  subscribeToStudentAppointments(
    studentId: string,
    callback: (appointments: Appointment[]) => void
  ): () => void {
    const q = query(
      this.appointmentsRef,
      where('studentIds', 'array-contains', studentId)
    );

    return onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs.map(doc => this.convertFromFirestore(doc.data(), doc.id));
      
      // Sort appointments by date in memory
      const sortedAppointments = appointments.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      callback(sortedAppointments);
    }, (error) => {
      console.error('Error in student appointment subscription:', error);
    });
  }

  async acceptAppointment(appointmentId: string): Promise<void> {
    try {
      const appointmentRef = doc(this.appointmentsRef, appointmentId);
      await updateDoc(appointmentRef, {
        status: 'accepted',
        updatedAt: Timestamp.now(),
      });

      // Send notification
      const appointment = await this.getAppointment(appointmentId);
      if (appointment) {
        await notificationService.notify({
          message: 'Your appointment has been accepted',
          type: 'success',
          recipientId: appointment.createdBy,
          relatedAppointmentId: appointmentId
        });
      }
    } catch (error) {
      console.error('Error accepting appointment:', error);
      throw error;
    }
  }

  async rejectAppointment(appointmentId: string): Promise<void> {
    try {
      const appointmentRef = doc(this.appointmentsRef, appointmentId);
      await updateDoc(appointmentRef, {
        status: 'rejected',
        updatedAt: Timestamp.now(),
      });

      // Send notification
      const appointment = await this.getAppointment(appointmentId);
      if (appointment) {
        await notificationService.notify({
          message: 'Your appointment has been rejected',
          type: 'error',
          recipientId: appointment.createdBy,
          relatedAppointmentId: appointmentId
        });
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      throw error;
    }
  }

  async addAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.createAppointment(appointmentData);
  }

  async getAllAppointments(): Promise<Appointment[]> {
    try {
      const querySnapshot = await getDocs(query(this.appointmentsRef, orderBy('createdAt', 'desc')));
      return querySnapshot.docs.map(doc => this.convertFromFirestore(doc.data(), doc.id));
    } catch (error) {
      console.error('Error getting all appointments:', error);
      throw error;
    }
  }

  async updateAppointment(appointmentId: string, updateData: Partial<Appointment>): Promise<void> {
    try {
      const appointmentRef = doc(this.appointmentsRef, appointmentId);
      await updateDoc(appointmentRef, {
        ...updateData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }
}

export const appointmentService = new AppointmentService();
