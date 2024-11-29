import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, Timestamp, orderBy, onSnapshot } from 'firebase/firestore';
import type { Appointment } from '../types/appointment';
import { notificationService } from './notificationService';
import { facilityService } from './facilityService';
import type { Notification } from '../types/notification';

export type { Appointment };

type NotificationType = Notification['type'];

class AppointmentService {
  private appointmentsRef = collection(db, 'appointments');

  // Convert Firestore data to Appointment type
  private convertToAppointment(data: any, id: string): Appointment {
    return {
      id,
      facultyId: data.facultyId,
      studentIds: data.studentIds || [],
      date: data.date?.toDate() || new Date(),
      startTime: data.startTime,
      endTime: data.endTime,
      meetingType: data.meetingType,
      meetingLink: data.meetingLink,
      facilityId: data.facilityId,
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

  async createAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      if (appointmentData.meetingType === 'physical' && appointmentData.facilityId) {
        const isAvailable = await facilityService.checkFacilityAvailability(
          appointmentData.facilityId,
          appointmentData.date,
          appointmentData.startTime,
          appointmentData.endTime
        );
        if (!isAvailable) {
          throw new Error('Facility is not available for the selected time slot');
        }
      }

      const appointmentWithDates = {
        ...appointmentData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(this.appointmentsRef, appointmentWithDates);
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
      
      return this.convertToAppointment(appointmentDoc.data(), appointmentDoc.id);
    } catch (error) {
      console.error('Error getting appointment:', error);
      throw error;
    }
  }

  async getFacultyAppointments(facultyId: string): Promise<Appointment[]> {
    try {
      const q = query(this.appointmentsRef, where('facultyId', '==', facultyId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.convertToAppointment(doc.data(), doc.id));
    } catch (error) {
      console.error('Error getting faculty appointments:', error);
      throw error;
    }
  }

  async getStudentAppointments(studentId: string): Promise<Appointment[]> {
    try {
      const q = query(this.appointmentsRef, where('studentIds', 'array-contains', studentId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.convertToAppointment(doc.data(), doc.id));
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
      return querySnapshot.docs.map(doc => this.convertToAppointment(doc.data(), doc.id));
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

      const status = appointmentData.createdByRole === 'faculty' ? 'accepted' : 'pending';
      const appointmentId = await this.createAppointment({
        ...appointmentData,
        status,
        createdByName
      });

      const appointment = await this.getAppointment(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found after creation');
      }

      // Notify relevant users
      await notificationService.createNotification({
        message: `Your appointment request has been ${status}`,
        type: status === 'accepted' ? 'success' : 'error',
        recipientId: appointment.createdBy,
        relatedAppointmentId: appointmentId,
        read: false
      });

      // Notify faculty if student created
      if (appointment.createdByRole === 'student') {
        await notificationService.createNotification({
          message: `A student has requested an appointment for ${appointment.date}`,
          type: 'alert',
          recipientId: appointment.facultyId,
          relatedAppointmentId: appointmentId,
          read: false
        });
      }

      return appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async updateAppointmentStatus(
    appointmentId: string, 
    status: Appointment['status'],
    updatedBy: string
  ): Promise<void> {
    try {
      const appointment = await this.getAppointment(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      await updateDoc(doc(this.appointmentsRef, appointmentId), {
        status,
        updatedAt: new Date(),
        updatedBy
      });

      // Notify relevant users
      const getStatusType = (status: string): NotificationType => {
        if (status === 'accepted') return 'success';
        if (status === 'rejected') return 'error';
        return 'alert';
      };

      const notificationData = {
        message: `Appointment status has been updated to ${status}`,
        type: getStatusType(status),
        relatedAppointmentId: appointmentId,
        read: false
      };

      // Notify all involved parties
      await notificationService.createNotification({
        ...notificationData,
        recipientId: appointment.facultyId
      });

      for (const studentId of appointment.studentIds) {
        await notificationService.createNotification({
          ...notificationData,
          recipientId: studentId
        });
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
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
      const appointment = await this.getAppointment(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      await deleteDoc(doc(this.appointmentsRef, appointmentId));

      // Notify users about deletion
      const notificationData = {
        message: `The appointment scheduled for ${appointment.date} has been deleted`,
        type: 'alert' as NotificationType,
        relatedAppointmentId: appointmentId,
        read: false
      };

      await notificationService.createNotification({
        ...notificationData,
        recipientId: appointment.facultyId
      });

      for (const studentId of appointment.studentIds) {
        await notificationService.createNotification({
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
      // Temporarily remove the orderBy clause to avoid requiring composite index
      const q = query(
        this.appointmentsRef,
        where('facultyId', '==', facultyId)
      );
      const querySnapshot = await getDocs(q);
      const appointments = querySnapshot.docs.map(doc => this.convertToAppointment(doc.data(), doc.id));
      
      // Sort in memory instead
      return appointments.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error getting faculty appointments:', error);
      throw error;
    }
  }

  subscribeToFacultyAppointments(
    facultyId: string,
    callback: (appointments: Appointment[]) => void
  ): () => void {
    // Temporarily remove the orderBy clause to avoid requiring composite index
    const q = query(
      this.appointmentsRef,
      where('facultyId', '==', facultyId)
    );

    return onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs.map(doc => this.convertToAppointment(doc.data(), doc.id));
      
      // Sort in memory instead
      const sortedAppointments = appointments.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      
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
      const appointments = snapshot.docs.map(doc => this.convertToAppointment(doc.data(), doc.id));
      
      // Sort in memory
      const sortedAppointments = appointments.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      
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
        updatedAt: new Date(),
      });

      // Send notification
      const appointment = await this.getAppointment(appointmentId);
      if (appointment) {
        await notificationService.createNotification({
          message: 'Your appointment has been accepted',
          type: 'success',
          recipientId: appointment.createdBy,
          relatedAppointmentId: appointmentId,
          read: false
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
        updatedAt: new Date(),
      });

      // Send notification
      const appointment = await this.getAppointment(appointmentId);
      if (appointment) {
        await notificationService.createNotification({
          message: 'Your appointment has been rejected',
          type: 'error',
          recipientId: appointment.createdBy,
          relatedAppointmentId: appointmentId,
          read: false
        });
      }
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      throw error;
    }
  }
}

export const appointmentService = new AppointmentService();
