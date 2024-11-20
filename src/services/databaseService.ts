//databaseService.ts

import { 
  getFirestore, 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { firebaseApp } from './firebase';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Appointment } from "../components/types";

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
// Define TypeScript interfaces for type safety
interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}
// Define an interface for user data
export interface UserData {
  name: string;
  email: string;
  role: string;
  faculty: string;
  profilePicture?: string; 
  password: string;
}




export interface Facility {
  id: string;
  name: string;
  location: string;    
  status: string;       
  availableSlots: string[]; 
}


interface Document {
  documentId: string;
  title: string;
  description: string;
  fileUrl: string;
  category: string;
  createdBy: string;
  createdAt: string;
}

interface Slot {
  time: string;
  isAvailable: boolean;
}/**
 * Adds a new user to the Firestore database.
 * @param {UserData} userData - Data of the user to add.
 * @returns {Promise<string>} The ID of the newly created user document.
 */
export const addUser = async (userData: UserData): Promise<string> => {
  try {
    // Step 1: Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const userId = userCredential.user.uid;

    // Step 2: Save user details in Firestore
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      faculty: userData.faculty,
      isActive: true, // default to active
    });

    console.log("User added to both Auth and Firestore with ID:", userId);
    return userId;
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
};



// Adds a new appointment to the database
export const addAppointment = async (appointmentData: Appointment): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "appointments"), {
      ...appointmentData,
      date: Timestamp.fromDate(appointmentData.date),
    });
    console.log("Appointment added successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding appointment:", error);
    throw new Error("Failed to add appointment.");
  }
};

// Updates an appointment by ID
export const updateAppointment = async (appointmentId: string, updateData: Partial<Appointment>): Promise<void> => {
  try {
    const appointmentRef = doc(db, "appointments", appointmentId);
    await updateDoc(appointmentRef, {
      ...updateData,
      ...(updateData.date && { date: Timestamp.fromDate(updateData.date) }),
    });
    console.log("Appointment updated successfully:", appointmentId);
  } catch (error) {
    console.error("Error updating appointment:", error);
    throw new Error("Failed to update appointment.");
  }
};

// Cancels an appointment
export const cancelAppointment = async (appointmentId: string): Promise<void> => {
  try {
    await updateAppointment(appointmentId, { status: "cancelled" });
    console.log("Appointment cancelled successfully:", appointmentId);
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    throw new Error("Failed to cancel appointment.");
  }
};




// Function to get user data by user ID
export const getUserData = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        userId: userDoc.id,
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || '',
        isActive: userData.boolean|| '',
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};
// Add a new event
export const addEvent = async (eventData: { title: string; description: string; date: string }) => {
  try {
    await addDoc(collection(db, 'events'), eventData);
  } catch (error) {
    console.error("Error adding event: ", error);
    throw error;
  }
};
// Fetch all students
export const getAllStudents = async () => {
  const studentsSnapshot = await getDocs(collection(db, 'students'));
  return studentsSnapshot.docs.map(doc => doc.data());
};

// Fetch all faculties
export const getAllFaculties = async () => {
  const facultiesSnapshot = await getDocs(collection(db, 'faculties'));
  return facultiesSnapshot.docs.map(doc => doc.data());
};

// Fetch all facilities
export const getAllFacilities = async (): Promise<Facility[]> => {
  try {
    const facilitiesSnapshot = await getDocs(collection(db, 'facilities'));
    return facilitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'Unnamed Facility',
      location: doc.data().location || 'Unknown Location',
      status: doc.data().status || 'Available',
      availableSlots: doc.data().availableSlots || []
    })) as Facility[];
  } catch (error) {
    console.error('Error fetching facilities:', error);
    throw new Error('Failed to fetch facilities');
  }
};
// Function to get appointments for a specific user
export const getAppointments = async (userId: string): Promise<Appointment[]> => {
  try {
    const appointmentsQuery = query(collection(db, "appointments"), where("userId", "==", userId));
    const querySnapshot = await getDocs(appointmentsQuery);

    return querySnapshot.docs.map(doc => ({
      appointmentId: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
    })) as Appointment[];
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw new Error("Failed to fetch appointments.");
  }
};

// New method to fetch available slots for a specific facility on a selected date
export const getAvailableSlots = async (facilityId: string, date: Timestamp): Promise<string[]> => {
  try {
    const facilityRef = doc(db, "facilities", facilityId);
    const snapshot = await getDoc(facilityRef);
    const facilityData = snapshot.data();

    if (facilityData) {
      // Simulate fetching booked slots; replace with actual Firestore logic
      const bookedSlotsQuery = query(
        collection(db, "facilityBookings"),
        where("facilityId", "==", facilityId),
        where("date", "==", date)
      );
      const bookedSlotsSnapshot = await getDocs(bookedSlotsQuery);
      const bookedSlots = bookedSlotsSnapshot.docs.map((doc) => doc.data().slot);

      return facilityData.availableSlots?.filter((slot: string) => !bookedSlots.includes(slot)) || [];
    }

    throw new Error("Facility data not found");
  } catch (error) {
    console.error("Error fetching available slots:", error);
    throw new Error("Failed to fetch available slots");
  }
};

// New method to book a facility

export const bookFacility = async (facilityId: string, slot: string, date: Timestamp, userId: string): Promise<void> => {
  try {
    const facilityRef = doc(db, 'facilities', facilityId);
    const facilityDoc = await getDoc(facilityRef);

    if (!facilityDoc.exists()) {
      throw new Error(`Facility not found for ID: ${facilityId}`);
    }

    const availableSlots = facilityDoc.data()?.availableSlots || [];
    if (!availableSlots.includes(slot)) {
      throw new Error(`Slot ${slot} is not available for facility ${facilityId}`);
    }

    // Add booking to Firestore
    const bookingData = {
      facilityId,
      slot,
      date,
      userId,
      status: "booked",
    };
    await addDoc(collection(db, "facilityBookings"), bookingData);

    // Update facility availability
    const updatedSlots = availableSlots.filter((s: string) => s !== slot);
    await updateDoc(facilityRef, { availableSlots: updatedSlots });

    console.log("Facility successfully booked");
  } catch (error) {
    console.error("Error booking facility:", error);
    throw new Error("Failed to book facility");
  }
};
// Function to update system settings in the Firestore database.
export const updateSystemSettings = async (settings: any): Promise<void> => {
  const settingsRef = doc(getFirestore(firebaseApp), "systemSettings", "settings");
  try {
    await setDoc(settingsRef, settings, { merge: true });
    console.log("System settings updated successfully.");
  } catch (error) {
    console.error("Error updating system settings:", error);
    throw error; // Rethrow to handle errors in the component
  }
};
// Function to fetch system settings from the Firestore database.
export const getSystemSettings = async (): Promise<any> => {
  const settingsRef = doc(getFirestore(firebaseApp), "systemSettings", "settings");
  try {
    const snapshot = await getDoc(settingsRef);
    if (snapshot.exists()) {
      return snapshot.data(); // Return the settings data if available
    } else {
      console.log("No settings found, returning defaults");
      return { maxAppointmentsPerDay: 0, enableRegistration: false }; // Default settings
    }
  } catch (error) {
    console.error("Error fetching system settings:", error);
    throw error; // Rethrow to handle errors in the component
  }
};
// Fetch all users from the database
// Get all users with role validation
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    return usersSnapshot.docs.map(doc => ({
      userId: doc.id,
      name: doc.data().name || 'Unknown User',
      email: doc.data().email || 'No Email Provided',
      role: doc.data().role || 'No Role Assigned',
      isActive: doc.data().isActive || false
    })) as User[];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
};

// Update a user in the database
export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, userData);
};
// Fetch the facilities settings
export const getFacilitiesSettings = async () => {
  const settingsRef = doc(db, "settings", "facilities");
  const docSnap = await getDoc(settingsRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    // Ensure that the returned data has the required properties
    return {
      maxBookingsPerFacility: data.maxBookingsPerFacility || 0, // Default to 0 if missing
      enableFacilityBooking: data.enableFacilityBooking || false, // Default to false if missing
    };
  } else {
    throw new Error("No facilities settings found");
  }
};

// Update the facilities settings
export const updateFacilitiesSettings = async (settings: any) => {
  const settingsRef = doc(db, "settings", "facilities");  // Adjust this path to match your Firestore structure
  await setDoc(settingsRef, settings, { merge: true });  // Merge ensures we don't overwrite the entire document
};

// Existing databaseService object

export const databaseService = {
 

  // Fetch user data by ID
  async getUserData(userId: string): Promise<any> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw new Error('Error fetching user data');
    }
  },

  // Add a new user to the Firestore database
  async addUser(userId: string, userData: any): Promise<void> {
    try {
      await setDoc(doc(db, 'users', userId), userData);
      console.log('User added successfully');
    } catch (error) {
      console.error('Error adding user:', error);
      throw new Error('Error adding user');
    }
  },

  // Generates a unique document ID
  generateDocumentId: (): string => {
    return `doc_${new Date().getTime().toString()}`;
  },

  // Fetch a user by ID
  async getUser(userId: string): Promise<any> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Error fetching user');
    }
  },

  // Add a new appointment to Firestore
  async addAppointment(appointmentData: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding appointment:', error);
      throw new Error('Error adding appointment');
    }
  },

  // Fetch all appointments for a specific user
  async getAppointmentsForUser(userId: string): Promise<Appointment[]> {
    try {
      const appointmentsQuery = query(collection(db, 'appointments'), where('userId', '==', userId));
      const querySnapshot = await getDocs(appointmentsQuery);
      return querySnapshot.docs.map(doc => ({
        appointmentId: doc.id,
        ...doc.data(),
      })) as Appointment[];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw new Error('Error fetching appointments');
    }
  },

  // Fetch all facilities, with default values for missing data
  async getFacilities(): Promise<Facility[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'facilities'));
      const facilitiesList: Facility[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().FacilityName||doc.data().name||doc.data().facilityName,
        location: doc.data().location || 'Not specified', // Ensure location is available
        status: doc.data().status || 'Available', // Ensure status is available
        availableSlots: doc.data().availableSlots || [] // Ensure availableSlots is available
      }));
      return facilitiesList;
    } catch (error) {
      console.error('Error fetching facilities:', error);
      throw new Error('Error fetching facilities');
    }
  },

  // Fetch available slots for a specific facility and date
  async getAvailableSlots(facilityId: string, date: Timestamp): Promise<string[]> {
    try {
      const facilityRef = doc(db, 'facilities', facilityId);
      const snapshot = await getDoc(facilityRef);
      const facilityData = snapshot.data();
      if (facilityData) {
        return facilityData.availableSlots || [];
      }
      throw new Error('Facility data not found');
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw new Error('Error fetching available slots');
    }
  },

  // Book a facility for a specific time slot
  async bookFacility(facilityId: string, slot: string, date: Timestamp, p0?: string): Promise<void> {
    try {
      const bookingData = {
        facilityId,
        slot,
        date,
        status: 'booked',
        userId: 'user-id-placeholder', // Replace with actual user ID
      };
      await addDoc(collection(db, 'facilityBookings'), bookingData);
      await this.updateFacilityAvailability(facilityId, slot, date); // Update availability after booking
    } catch (error) {
      console.error('Error booking facility:', error);
      throw new Error('Error booking facility');
    }
  },

  // Update facility availability after a booking
  async updateFacilityAvailability(facilityId: string, slot: string, date: Timestamp): Promise<void> {
    try {
      const facilityRef = doc(db, 'facilities', facilityId);
      const facilityDoc = await getDoc(facilityRef);
      const availableSlots = facilityDoc.data()?.availableSlots || [];
      const updatedSlots = availableSlots.filter((s: string) => s !== slot); // Remove the booked slot
      await updateDoc(facilityRef, { availableSlots: updatedSlots });
      console.log('Facility availability updated');
    } catch (error) {
      console.error('Error updating facility availability:', error);
      throw new Error('Error updating facility availability');
    }
  },
  // Fetch all students from Firestore
  async getAllStudents(): Promise<any[]> {
    try {
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      return studentsSnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error fetching students:', error);
      throw new Error('Error fetching students');
    }
  },

  // Fetch all faculties from Firestore
  async getAllFaculties(): Promise<any[]> {
    try {
      const facultiesSnapshot = await getDocs(collection(db, 'faculties'));
      return facultiesSnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error fetching faculties:', error);
      throw new Error('Error fetching faculties');
    }
  },

  // Fetch documents from the 'documents' collection
  async getDocuments(): Promise<Document[]> {
    try {
      const documentsCollection = collection(db, 'documents');
      const documentsSnapshot = await getDocs(documentsCollection);
      return documentsSnapshot.docs.map(doc => ({
        documentId: doc.id,
        ...doc.data(),
      })) as Document[];
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Error fetching documents');
    }
  },

  // Save a new document to the 'documents' collection
  async saveDocument(document: Document): Promise<void> {
    try {
      const documentsCollection = collection(db, 'documents');
      await addDoc(documentsCollection, document);
      console.log('Document saved successfully');
    } catch (error) {
      console.error('Error saving document:', error);
      throw new Error('Error saving document');
    }
  }
};
// Fetch documents from the 'documents' collection in Firestore
export const getDocuments = async (): Promise<Document[]> => {
  try {
    const documentsCollection = collection(db, 'documents');
    const documentsSnapshot = await getDocs(documentsCollection);
    return documentsSnapshot.docs.map(doc => ({
      documentId: doc.id,
      ...doc.data(),
    })) as Document[];  // Ensure the data structure matches the Document type
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw new Error('Error fetching documents');
  }
};

export const getFacilityBookings = async (userId: string) => {
  try {
    // Fetch the facility bookings for the given user
    const bookingsQuery = query(
      collection(db, 'facilityBookings'),
      where('userId', '==', userId) // Filter by the user ID
    );
    const querySnapshot = await getDocs(bookingsQuery);
    return querySnapshot.docs.map(doc => ({
      bookingId: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(), // Convert timestamp to Date object
    }));
  } catch (error) {
    console.error('Error fetching facility bookings:', error);
    throw error;
  }
};

export default databaseService;