import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

// Define types for facility and slot
interface Facility {
  id: string;
  name: string;
  location: string;
  status: string;
  availableSlots: string[];
  capacity?: number; // Added optional capacity field
}

interface Slot {
  time: string;
  isAvailable: boolean;
}

// Fetch all facilities (excluding facilities with "pending" status)
export const getFacilities = async (): Promise<Facility[]> => {
  try {
    const facilitiesRef = collection(db, 'facilities');
    const snapshot = await getDocs(facilitiesRef);

    const facilitiesList: Facility[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().FacilityName || doc.data().name||doc.data().facilityName,
      location: doc.data().location || 'Unknown Location',
      status: doc.data().status || 'active',
      availableSlots: doc.data().availableSlots || [],
      capacity: doc.data().capacity || 0,
    }));

    return facilitiesList;
  } catch (error) {
    console.error('Error fetching facilities:', error);
    throw new Error('Failed to fetch facilities');
  }
};


// Fetch available slots for a specific facility and date
export const getAvailableSlots = async (
  facilityId: string,
  date: Timestamp
): Promise<string[]> => {
  try {
    const facilityRef = doc(db, 'facilities', facilityId);
    const snapshot = await getDoc(facilityRef);

    if (!snapshot.exists()) {
      throw new Error(`Facility with ID ${facilityId} does not exist`);
    }

    const facilityData = snapshot.data();
    const bookedSlotsQuery = query(
      collection(db, 'facilityBookings'),
      where('facilityId', '==', facilityId),
      where('date', '==', date)
    );

    const bookedSlotsSnapshot = await getDocs(bookedSlotsQuery);
    const bookedSlots = bookedSlotsSnapshot.docs.map((doc) => doc.data().slot);

    const availableSlots = facilityData.availableSlots.filter(
      (slot: string) => !bookedSlots.includes(slot)
    );

    return availableSlots;
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw new Error('Failed to fetch available slots');
  }
};


// Book a facility
export const bookFacility = async (
  facilityId: string,
  slot: string,
  date: Timestamp,
  userId: string
): Promise<void> => {
  try {
    const availableSlots = await getAvailableSlots(facilityId, date);
    if (!availableSlots.includes(slot)) {
      throw new Error(`Slot ${slot} is not available for facility ${facilityId}`);
    }

    const bookingData = {
      facilityId,
      slot,
      date,
      userId,
      status: 'booked',
    };

    await addDoc(collection(db, 'facilityBookings'), bookingData);
    await updateFacilityAvailability(facilityId, slot);
  } catch (error) {
    console.error('Error booking facility:', error);
    throw new Error('Failed to book facility');
  }
};

// Update facility availability after booking
const updateFacilityAvailability = async (
  facilityId: string,
  slot: string
): Promise<void> => {
  try {
    const facilityRef = doc(db, 'facilities', facilityId);
    const snapshot = await getDoc(facilityRef);

    if (!snapshot.exists()) {
      throw new Error(`Facility with ID ${facilityId} does not exist`);
    }

    const availableSlots = snapshot.data().availableSlots || [];
    const updatedSlots = availableSlots.filter((s: string) => s !== slot);

    await updateDoc(facilityRef, { availableSlots: updatedSlots });
  } catch (error) {
    console.error('Error updating facility availability:', error);
    throw new Error('Failed to update facility availability');
  }
};

// Add a new facility
export const addFacility = async (
  facility: Omit<Facility, 'id'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'facilities'), {
      facilityName: facility.name, // Align with database naming
      location: facility.location,
      status: facility.status || 'active', // Default status to 'active'
      availableSlots: facility.availableSlots || [], // Default to empty slots
      capacity: facility.capacity || 0, // Default capacity to 0
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding facility:', error);
    throw new Error('Failed to add facility');
  }
};


// Remove a facility
export const removeFacility = async (facilityId: string): Promise<void> => {
  try {
    const facilityRef = doc(db, 'facilities', facilityId);
    await deleteDoc(facilityRef);
    console.log(`Facility with ID ${facilityId} removed successfully.`);
  } catch (error) {
    console.error('Error removing facility:', error);
    throw new Error('Failed to remove facility.');
  }
};

// Update facility details
export const updateFacility = async (
  facilityId: string,
  updatedData: Partial<Facility>
): Promise<void> => {
  try {
    const facilityRef = doc(db, 'facilities', facilityId);
    const formattedData: Partial<Facility> = {
      ...(updatedData.name && { facilityName: updatedData.name }),
      ...(updatedData.location && { location: updatedData.location }),
      ...(updatedData.status && { status: updatedData.status }),
      ...(updatedData.availableSlots && { availableSlots: updatedData.availableSlots }),
      ...(updatedData.capacity && { capacity: updatedData.capacity }),
    };
    await updateDoc(facilityRef, formattedData);
    console.log(`Facility with ID ${facilityId} updated successfully.`);
  } catch (error) {
    console.error('Error updating facility:', error);
    throw new Error('Failed to update facility.');
  }
};


// Update facility status (e.g., mark as "pending")
export const updateFacilityStatus = async (
  facilityId: string,
  status: string
): Promise<void> => {
  try {
    const facilityRef = doc(db, 'facilities', facilityId);
    await updateDoc(facilityRef, { status });
    console.log(`Facility with ID ${facilityId} status updated to ${status}.`);
  } catch (error) {
    console.error('Error updating facility status:', error);
    throw new Error('Failed to update facility status.');
  }
};

export const facilitiesService = {
  getFacilities,
  getAvailableSlots,
  bookFacility,
  addFacility,
  removeFacility,
  updateFacility,
  updateFacilityStatus,
};

export default facilitiesService;
