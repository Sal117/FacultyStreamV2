import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';

// Function to fetch all available facilities
export const fetchFacilities = async () => {
  try {
    const facilitiesSnapshot = await getDocs(collection(db, 'facilities'));
    const facilities = facilitiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return facilities;
  } catch (error) {
    console.error('Error fetching facilities:', error);
    throw new Error('Failed to fetch facilities');
  }
};

// Function to fetch available slots for a specific facility and date
export const fetchAvailableSlots = async (facilityId: string, selectedDate: string) => {
  try {
    const facilityDocRef = doc(db, 'facilities', facilityId);
    const facilityDoc = await getDoc(facilityDocRef);
    if (facilityDoc.exists()) {
      const availableSlots = facilityDoc.data()?.availableSlots || [];
      const selectedTimestamp = Timestamp.fromDate(new Date(selectedDate));
      
      // Filter slots that are available and match the selected date
      return availableSlots.filter((slot: any) => slot.date.toDate().getTime() === selectedTimestamp.toDate().getTime());
    } else {
      throw new Error('Facility not found');
    }
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw new Error('Failed to fetch available slots');
  }
};

// Function to handle booking a facility
export const bookFacility = async (
  facilityId: string,
  selectedSlot: string,
  bookingDate: string,
  userId: string
) => {
  try {
    const facilityDocRef = doc(db, 'facilities', facilityId);
    const facilityDoc = await getDoc(facilityDocRef);

    if (facilityDoc.exists()) {
      const slots = facilityDoc.data()?.availableSlots || [];
      const updatedSlots = slots.map((slot: any) => {
        if (slot.slot === selectedSlot && slot.date.toDate().getTime() === new Date(bookingDate).getTime()) {
          return { ...slot, status: 'booked' }; // Mark the slot as booked
        }
        return slot;
      });

      // Update the available slots in Firestore
      await updateDoc(facilityDocRef, {
        availableSlots: updatedSlots,
      });

      // Create a booking entry in Firestore (appointments collection)
      const bookingData = {
        facilityId,
        slot: selectedSlot,
        date: Timestamp.fromDate(new Date(bookingDate)), // Store date as Firestore Timestamp
        userId,
        status: 'confirmed',
        createdAt: Timestamp.now(), // Use Firestore server timestamp
      };

      await addDoc(collection(db, 'appointments'), bookingData); // Use addDoc to generate a new document ID

      console.log('Booking confirmed for facility:', facilityId);
    } else {
      throw new Error('Facility not found');
    }
  } catch (error) {
    console.error('Error booking facility:', error);
    throw new Error('Failed to book facility');
  }
};
