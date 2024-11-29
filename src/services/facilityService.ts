// facilityService.ts
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, Timestamp, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Facility {
  id: string;
  name: string;
  location: string;
  capacity: number;
  type: 'classroom' | 'meeting-room' | 'lab' | 'office';
  amenities: string[];
  status: 'available' | 'maintenance' | 'reserved';
  schedule: {
    [date: string]: {
      [timeSlot: string]: {
        isAvailable: boolean;
        appointmentId?: string;
      };
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  startTime: string;  // Format: "HH:mm"
  endTime: string;    // Format: "HH:mm"
  isAvailable: boolean;
  appointmentId?: string;
}

interface AppointmentWithTime {
  id: string;
  startTime: string;
  endTime: string;
  [key: string]: any;
}

class FacilityService {
  // Add a new facility
  async addFacility(facilityData: Omit<Facility, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'facilities'), {
        ...facilityData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`Facility added with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Failed to add facility:', error);
      throw new Error('Failed to add facility');
    }
  }

  // Get all facilities
  async getAllFacilities(): Promise<Facility[]> {
    try {
      const snapshot = await getDocs(collection(db, 'facilities'));
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(),
          schedule: data.schedule || {},
          amenities: data.amenities || [],
          status: data.status || 'available',
          type: data.type || 'meeting-room'
        } as Facility;
      });
    } catch (error) {
      console.error('Failed to fetch facilities:', error);
      throw new Error('Failed to fetch facilities');
    }
  }

  // Get available facilities for a specific date and time range
  async getAvailableFacilities(date: Date, startTime: string, endTime: string): Promise<Facility[]> {
    try {
      const facilities = await this.getAllFacilities();
      const dateString = date.toISOString().split('T')[0];
      
      return facilities.filter(facility => {
        const schedule = facility.schedule?.[dateString];
        if (!schedule) return true; // No bookings for this date

        // Check if the facility is available for the entire time range
        for (const timeSlot in schedule) {
          const [slotStart, slotEnd] = timeSlot.split('-');
          if (
            this.isTimeOverlap(startTime, endTime, slotStart, slotEnd) &&
            !schedule[timeSlot].isAvailable
          ) {
            return false;
          }
        }
        return true;
      });
    } catch (error) {
      console.error('Failed to fetch available facilities:', error);
      throw new Error('Failed to fetch available facilities');
    }
  }

  private isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && end1 > start2;
  }

  // Reserve a facility for an appointment
  async reserveFacility(
    facilityId: string,
    date: Date,
    startTime: string,
    endTime: string,
    appointmentId: string
  ): Promise<void> {
    try {
      const facilityRef = doc(db, 'facilities', facilityId);
      const facilityDoc = await getDoc(facilityRef);
      
      if (!facilityDoc.exists()) {
        throw new Error('Facility not found');
      }

      const dateString = date.toISOString().split('T')[0];
      const timeSlot = `${startTime}-${endTime}`;
      const currentData = facilityDoc.data();
      const schedule = currentData.schedule || {};

      // Initialize the schedule for this date if it doesn't exist
      if (!schedule[dateString]) {
        schedule[dateString] = {};
      }

      // Update the time slot
      schedule[dateString][timeSlot] = {
        isAvailable: false,
        appointmentId
      };

      await updateDoc(facilityRef, {
        schedule,
        updatedAt: Timestamp.now(),
        status: 'reserved'
      });

    } catch (error) {
      console.error('Failed to reserve facility:', error);
      throw new Error('Failed to reserve facility');
    }
  }

  // Release a facility reservation
  async releaseFacility(
    facilityId: string,
    date: Date,
    startTime: string,
    endTime: string
  ): Promise<void> {
    try {
      const facilityRef = doc(db, 'facilities', facilityId);
      const facilityDoc = await getDoc(facilityRef);
      
      if (!facilityDoc.exists()) {
        throw new Error('Facility not found');
      }

      const dateString = date.toISOString().split('T')[0];
      const timeSlot = `${startTime}-${endTime}`;
      const currentData = facilityDoc.data();
      const schedule = currentData.schedule || {};

      if (schedule[dateString] && schedule[dateString][timeSlot]) {
        schedule[dateString][timeSlot].isAvailable = true;
        delete schedule[dateString][timeSlot].appointmentId;
      }

      await updateDoc(facilityRef, {
        schedule,
        updatedAt: Timestamp.now(),
        status: 'available'
      });

    } catch (error) {
      console.error('Failed to release facility:', error);
      throw new Error('Failed to release facility');
    }
  }

  // Check if a facility is available for a specific date and time range
  async checkFacilityAvailability(
    facilityId: string,
    date: Date,
    startTime: string,
    endTime: string,
    appointmentId?: string
  ): Promise<boolean> {
    try {
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('facilityId', '==', facilityId),
        where('date', '==', date),
        where('status', 'in', ['pending', 'accepted'])
      );

      const querySnapshot = await getDocs(q);
      const conflictingAppointments = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AppointmentWithTime))
        .filter(app => 
          app.id !== appointmentId &&
          this.isTimeConflict(startTime, endTime, app.startTime, app.endTime)
        );

      return conflictingAppointments.length === 0;
    } catch (error) {
      console.error('Error checking facility availability:', error);
      throw error;
    }
  }

  // Helper function to check if two time ranges conflict
  private isTimeConflict(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const [start1Hour] = start1.split(':').map(Number);
    const [end1Hour] = end1.split(':').map(Number);
    const [start2Hour] = start2.split(':').map(Number);
    const [end2Hour] = end2.split(':').map(Number);

    return (
      (start1Hour >= start2Hour && start1Hour < end2Hour) ||
      (end1Hour > start2Hour && end1Hour <= end2Hour) ||
      (start1Hour <= start2Hour && end1Hour >= end2Hour)
    );
  }
}

export const facilityService = new FacilityService();
