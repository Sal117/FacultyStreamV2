// src/services/databaseService.ts

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
  deleteDoc,
  Timestamp,
  runTransaction, 
} from 'firebase/firestore';
import { 
  initializeApp, 
  getApps, 
  getApp, 
  FirebaseApp 
} from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  deleteUser 
} from 'firebase/auth';
import { Appointment } from "../components/types";
import { firebaseApp as primaryApp, db as primaryDb, auth as primaryAuth } from './firebase'; 
import { firebaseConfig } from '../config/firebase';

// Initialize Firestore and Auth
const db = getFirestore(primaryApp);
const auth = getAuth(primaryApp);


// ---------------------------
// Secondary Firebase App Setup
// ---------------------------


// Define a unique name for the secondary app to prevent conflicts
const secondaryAppName = "SecondaryApp";

// Initialize the secondary Firebase app only if it hasn't been initialized already
let secondaryApp: FirebaseApp;

if (!getApps().some(app => app.name === secondaryAppName)) {
  secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  console.log("Secondary Firebase app initialized.");
} else {
  secondaryApp = getApp(secondaryAppName);
  console.log("Secondary Firebase app already initialized.");
}

// Initialize Firebase Auth for the secondary app
const secondaryAuth = getAuth(secondaryApp);


// User Interfaces
export interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface UserData {
  name: string;
  email: string;
  role: "student" | "faculty" | "admin";
  faculty: string;
  password: string;
  phoneNumber: string;
  address: string;
  DOB: string;
  joinDate?: string;
  profilePicture?: string;
  isActive?: boolean;
  generatedId: string;
}

// Facility Interface
export interface Facility {
  id: string;
  name: string;
  location: string;    
  status: string;       
  availableSlots: string[]; 
  capacity?: number; // Optional capacity field
}

// Document Interface
export interface DocumentData {
  documentId: string;
  title: string;
  description: string;
  fileUrl: string;
  category: string;
  createdBy: string;
  createdAt: string;
}

// Announcement Interface
export interface Announcement {
  announcementId: string;
  title: string;
  content: string;
  createdBy: string; // userId of admin or faculty
  createdAt: Timestamp;
  // Additional fields can be added as needed
}

// System Settings Interface
export interface SystemSettings {
  maxAppointmentsPerDay: number;
  enableRegistration: boolean;
  // Add other system settings fields here
}

// Facilities Settings Interface
export interface FacilitiesSettings {
  maxBookingsPerFacility: number;
  enableFacilityBooking: boolean;
  // Add other facilities settings fields here
}

// Notification Interface
export interface Notification {
  notificationId: string;
  message: string;
  userId: string;
  read: boolean;
  createdAt: Timestamp;
}




// ---------------------------
// User Management
// ---------------------------
/**
 * Fetches the next available user ID based on the role using Firestore transactions.
 * Ensures that user IDs are sequential and unique.
 * @param {("student" | "faculty" | "admin")} role - The role of the user.
 * @returns {Promise<string>} - The next user ID as a string.
 */
export const getNextUserId = async (role: "student" | "faculty" | "admin"): Promise<string> => {
  const countersRef = doc(primaryDb, "counters", "userIds");
  try {
    const nextId = await runTransaction(primaryDb, async (transaction) => {
      const countersDoc = await transaction.get(countersRef);
      if (!countersDoc.exists()) {
        // Initialize counters if the document does not exist
        const initialCounters = { studentCounter: 1000, facultyCounter: 2000, adminCounter: 3000 };
        transaction.set(countersRef, initialCounters);
        return role === "student" ? 1000 : role === "faculty" ? 2000 : 3000;
      }

      const countersData = countersDoc.data();
      let currentCounter: number;

      if (role === "student") {
        currentCounter = countersData.studentCounter || 1000;
        transaction.update(countersRef, { studentCounter: currentCounter + 1 });
      } else if (role === "faculty") {
        currentCounter = countersData.facultyCounter || 2000;
        transaction.update(countersRef, { facultyCounter: currentCounter + 1 });
      } else { // admin
        currentCounter = countersData.adminCounter || 3000;
        transaction.update(countersRef, { adminCounter: currentCounter + 1 });
      }

      return currentCounter + 1;
    });

    return nextId.toString();
  } catch (error) {
    console.error("Error getting next user ID:", error);
    throw new Error("Failed to generate user ID.");
  }
};

/**
 * Adds a new user to Firebase Authentication and Firestore without affecting the primary auth state.
 * Utilizes a secondary Firebase app instance to prevent authentication state changes.
 * @param {UserData} userData - Data of the user to add, including generatedId.
 * @returns {Promise<string>} The Firebase Auth UID of the newly created user.
 */
export const addUser = async (userData: UserData): Promise<string> => {
  try {
    const validRoles = ["student", "faculty", "admin"];
    if (!validRoles.includes(userData.role)) {
      throw new Error(`Invalid role: ${userData.role}. Must be one of ${validRoles.join(", ")}`);
    }

    // Create user in Firebase Authentication using the secondary app
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      userData.email,
      userData.password
    );
    const userId = userCredential.user.uid;

    console.log(`User created in secondary auth with ID: ${userId}`);

    

    // Save user details in Firestore under the primary app's Firestore instance
    const userDocRef = doc(primaryDb, "users", userId);
    await setDoc(userDocRef, {
      uid: userId, // Firebase Auth UID
      generatedId: userData.generatedId, // Store the generated ascending ID
      name: userData.name,
      email: userData.email,
      role: userData.role,
      faculty: userData.faculty,
      phoneNumber: userData.phoneNumber,
      address: userData.address,
      DOB: userData.DOB,
      joinDate: userData.joinDate || new Date().toISOString(),
      profilePicture: userData.profilePicture || "",
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      lastLogin: null,
    });

    console.log(`User data saved in Firestore with UID: ${userId}`);
    return userId;
  } catch (error: any) {
    console.error("Error adding user:", error);
    throw new Error(error.message || "Failed to add user.");
  }
};
//rest of the code be

/**
 * Fetches user data by user ID.
 * @param {string} userId - The ID of the user to fetch.
 * @returns {Promise<User | null>} The user data or null if not found.
 */
export const getUserData = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(primaryDb, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        userId: userDoc.id,
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || '',
        isActive: userData.isActive !== undefined ? userData.isActive : false,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

/**
 * Fetches all users.
 * @returns {Promise<User[]>} List of all users.
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersSnapshot = await getDocs(collection(primaryDb, 'users'));
    return usersSnapshot.docs.map(doc => ({
      userId: doc.id,
      name: doc.data().name || 'Unknown User',
      email: doc.data().email || 'No Email Provided',
      role: doc.data().role || 'No Role Assigned',
      isActive: doc.data().isActive !== undefined ? doc.data().isActive : false
    })) as User[];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
};

/**
 * Updates a user's data.
 * @param {string} userId - The ID of the user to update.
 * @param {Partial<User>} userData - The data to update.
 * @returns {Promise<void>}
 */
export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(primaryDb, 'users', userId);
    await updateDoc(userRef, userData);
    console.log(`User ${userId} updated successfully.`);
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    throw error;
  }
};

/**
 * Deletes a user by ID.
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<void>}
 */
export const deleteUserById = async (userId: string): Promise<void> => {
  try {
    await deleteDoc(doc(primaryDb, 'users', userId));
    console.log(`User ${userId} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
};

// ---------------------------
// Appointments
// ---------------------------

/**
 * Adds a new appointment to Firestore.
 * @param {Appointment} appointmentData - The appointment data.
 * @returns {Promise<string>} The ID of the newly created appointment.
 */
export const addAppointment = async (appointmentData: Appointment): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "appointments"), {
      ...appointmentData,
      date: Timestamp.fromDate(new Date(appointmentData.date)), // Ensure date is a Timestamp
    });
    console.log("Appointment added successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding appointment:", error);
    throw new Error("Failed to add appointment.");
  }
};

/**
 * Updates an appointment by ID.
 * @param {string} appointmentId - The ID of the appointment to update.
 * @param {Partial<Appointment>} updateData - The data to update.
 * @returns {Promise<void>}
 */
export const updateAppointment = async (appointmentId: string, updateData: Partial<Appointment>): Promise<void> => {
  try {
    const appointmentRef = doc(db, "appointments", appointmentId);
    await updateDoc(appointmentRef, {
      ...updateData,
      ...(updateData.date && { date: Timestamp.fromDate(new Date(updateData.date)) }),
    });
    console.log("Appointment updated successfully:", appointmentId);
  } catch (error) {
    console.error("Error updating appointment:", error);
    throw new Error("Failed to update appointment.");
  }
};

/**
 * Cancels an appointment by ID.
 * @param {string} appointmentId - The ID of the appointment to cancel.
 * @returns {Promise<void>}
 */
export const cancelAppointment = async (appointmentId: string): Promise<void> => {
  try {
    await updateAppointment(appointmentId, { status: "cancelled" });
    console.log("Appointment cancelled successfully:", appointmentId);
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    throw new Error("Failed to cancel appointment.");
  }
};

/**
 * Fetches all appointments for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Appointment[]>} List of appointments.
 */
export const getAppointments = async (userId: string): Promise<Appointment[]> => {
  try {
    const appointmentsQuery = query(collection(db, "appointments"), where("userId", "==", userId));
    const querySnapshot = await getDocs(appointmentsQuery);

    return querySnapshot.docs.map(doc => ({
      appointmentId: doc.id,
      ...doc.data(),
      date: (doc.data().date as Timestamp).toDate(),
    })) as Appointment[];
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw new Error("Failed to fetch appointments.");
  }
};

/**
 * Fetches all appointments.
 * @returns {Promise<Appointment[]>} List of all appointments.
 */
export const getAllAppointments = async (): Promise<Appointment[]> => {
  try {
    const appointmentsSnapshot = await getDocs(collection(db, "appointments"));
    return appointmentsSnapshot.docs.map(doc => ({
      appointmentId: doc.id,
      ...doc.data(),
      date: (doc.data().date as Timestamp).toDate(),
    })) as Appointment[];
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw new Error("Failed to fetch appointments.");
  }
};

// ---------------------------
// Facilities
// ---------------------------

/**
 * Fetches all facilities.
 * @returns {Promise<Facility[]>} List of facilities.
 */
export const getAllFacilities = async (): Promise<Facility[]> => {
  try {
    const facilitiesSnapshot = await getDocs(collection(db, 'facilities'));
    return facilitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name ||doc.data().FacilityName|| 'Unnamed Facility',
      location: doc.data().location ||  'Unknown Location',
      status: doc.data().status || 'Available',
      availableSlots: doc.data().availableSlots || []
    })) as Facility[];
  } catch (error) {
    console.error('Error fetching facilities:', error);
    throw new Error('Failed to fetch facilities');
  }
};

/**
 * Fetches all facilities.
 * @returns {Promise<Facility[]>} List of facilities.
 */
export const getFacilities = async (): Promise<Facility[]> => {
  try {
    const facilitiesSnapshot = await getDocs(collection(db, 'facilities'));
    return facilitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name ||doc.data().FacilityName||  'General Facility',
      location: doc.data().location || 'Unknown Location',
      status: doc.data().status || 'Available',
      availableSlots: doc.data().availableSlots || [],
      capacity: doc.data().capacity || undefined
    })) as Facility[];
  } catch (error) {
    console.error('Error fetching facilities:', error);
    throw new Error('Failed to fetch facilities');
  }
};

/**
 * Fetches available slots for a specific facility on a selected date.
 * @param {string} facilityId - The ID of the facility.
 * @param {Timestamp} date - The selected date.
 * @returns {Promise<string[]>} List of available slots.
 */
export const getAvailableSlots = async (facilityId: string, date: Timestamp): Promise<string[]> => {
  try {
    const facilityRef = doc(db, "facilities", facilityId);
    const snapshot = await getDoc(facilityRef);
    const facilityData = snapshot.data();

    if (facilityData) {
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

/**
 * Books a facility for a specific slot and date.
 * @param {string} facilityId - The ID of the facility.
 * @param {string} slot - The time slot to book.
 * @param {Timestamp} date - The date of booking.
 * @param {string} userId - The ID of the user booking the facility.
 * @returns {Promise<void>}
 */
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

/**
 * Fetches all facility bookings for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<any[]>} List of facility bookings.
 */
export const getFacilityBookings = async (userId: string): Promise<any[]> => {
  try {
    const bookingsQuery = query(
      collection(db, 'facilityBookings'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(bookingsQuery);
    return querySnapshot.docs.map(doc => ({
      bookingId: doc.id,
      ...doc.data(),
      date: (doc.data().date as Timestamp).toDate(),
    }));
  } catch (error) {
    console.error('Error fetching facility bookings:', error);
    throw error;
  }
};

/**
 * Updates facility availability after a booking.
 * @param {string} facilityId - The ID of the facility.
 * @param {string} slot - The booked slot.
 * @param {Timestamp} date - The date of booking.
 * @returns {Promise<void>}
 */
export const updateFacilityAvailability = async (facilityId: string, slot: string, date: Timestamp): Promise<void> => {
  try {
    const facilityRef = doc(db, 'facilities', facilityId);
    const facilityDoc = await getDoc(facilityRef);
    const availableSlots = facilityDoc.data()?.availableSlots || [];
    const updatedSlots = availableSlots.filter((s: string) => s !== slot);
    await updateDoc(facilityRef, { availableSlots: updatedSlots });
    console.log('Facility availability updated');
  } catch (error) {
    console.error('Error updating facility availability:', error);
    throw new Error('Error updating facility availability');
  }
};


// ---------------------------
// System Settings
// ---------------------------

/**
 * Updates system settings in Firestore.
 * @param {SystemSettings} settings - The system settings to update.
 * @returns {Promise<void>}
 */
export const updateSystemSettings = async (settings: SystemSettings): Promise<void> => {
  const settingsRef = doc(db, "systemSettings", "settings");
  try {
    await setDoc(settingsRef, settings, { merge: true });
    console.log("System settings updated successfully.");
  } catch (error) {
    console.error("Error updating system settings:", error);
    throw error;
  }
};

/**
 * Fetches system settings from Firestore.
 * @returns {Promise<SystemSettings>} The system settings.
 */
export const getSystemSettings = async (): Promise<SystemSettings> => {
  const settingsRef = doc(db, "systemSettings", "settings");
  try {
    const snapshot = await getDoc(settingsRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        maxAppointmentsPerDay: data.maxAppointmentsPerDay || 0,
        enableRegistration: data.enableRegistration || false,
        // Add other settings with defaults as necessary
      };
    } else {
      console.log("No system settings found, returning defaults.");
      return { maxAppointmentsPerDay: 0, enableRegistration: false };
    }
  } catch (error) {
    console.error("Error fetching system settings:", error);
    throw error;
  }
};

// ---------------------------
// Facilities Settings
// ---------------------------

/**
 * Updates facilities settings in Firestore.
 * @param {FacilitiesSettings} settings - The facilities settings to update.
 * @returns {Promise<void>}
 */
export const updateFacilitiesSettings = async (settings: FacilitiesSettings): Promise<void> => {
  const settingsRef = doc(db, "settings", "facilities");
  try {
    await setDoc(settingsRef, settings, { merge: true });
    console.log("Facilities settings updated successfully.");
  } catch (error) {
    console.error("Error updating facilities settings:", error);
    throw error;
  }
};

/**
 * Fetches facilities settings from Firestore.
 * @returns {Promise<FacilitiesSettings>} The facilities settings.
 */
export const getFacilitiesSettings = async (): Promise<FacilitiesSettings> => {
  const settingsRef = doc(db, "settings", "facilities");
  try {
    const snapshot = await getDoc(settingsRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        maxBookingsPerFacility: data.maxBookingsPerFacility || 0,
        enableFacilityBooking: data.enableFacilityBooking || false,
        // Add other settings with defaults as necessary
      };
    } else {
      console.log("No facilities settings found, returning defaults.");
      return {
        maxBookingsPerFacility: 0,
        enableFacilityBooking: false,
      };
    }
  } catch (error) {
    console.error("Error fetching facilities settings:", error);
    throw error;
  }
};

// ---------------------------
// Documents
// ---------------------------

/**
 * Fetches all documents from the 'documents' collection.
 * @returns {Promise<DocumentData[]>} List of documents.
 */
export const getDocuments = async (): Promise<DocumentData[]> => {
  try {
    const documentsCollection = collection(db, 'documents');
    const documentsSnapshot = await getDocs(documentsCollection);
    return documentsSnapshot.docs.map(doc => ({
      documentId: doc.id,
      ...doc.data(),
    })) as DocumentData[];
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw new Error('Error fetching documents');
  }
};

/**
 * Saves a new document to the 'documents' collection.
 * @param {Omit<DocumentData, 'documentId' | 'createdAt'>} document - The document to save excluding ID and timestamp.
 * @returns {Promise<string>} The ID of the newly created document.
 */
export const saveDocument = async (document: Omit<DocumentData, 'documentId' | 'createdAt'>): Promise<string> => {
  try {
    const documentsCollection = collection(db, 'documents');
    const docRef = await addDoc(documentsCollection, {
      ...document,
      createdAt: Timestamp.now(),
    });
    console.log('Document saved successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving document:', error);
    throw new Error('Error saving document');
  }
};

/**
 * Updates a document by ID.
 * @param {string} documentId - The ID of the document to update.
 * @param {Partial<DocumentData>} updateData - The data to update.
 * @returns {Promise<void>}
 */
export const updateDocument = async (documentId: string, updateData: Partial<DocumentData>): Promise<void> => {
  try {
    const documentRef = doc(db, 'documents', documentId);
    await updateDoc(documentRef, updateData);
    console.log(`Document ${documentId} updated successfully.`);
  } catch (error) {
    console.error(`Error updating document ${documentId}:`, error);
    throw new Error('Error updating document');
  }
};

/**
 * Deletes a document by ID.
 * @param {string} documentId - The ID of the document to delete.
 * @returns {Promise<void>}
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'documents', documentId));
    console.log(`Document ${documentId} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting document ${documentId}:`, error);
    throw new Error('Error deleting document');
  }
};

// ---------------------------
// Notifications
// ---------------------------

/**
 * Adds a new notification.
 * @param {Omit<Notification, 'notificationId' | 'createdAt'>} notificationData - The notification data excluding ID and timestamp.
 * @returns {Promise<string>} The ID of the newly created notification.
 */
export const addNotification = async (notificationData: Omit<Notification, 'notificationId' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "notifications"), {
      ...notificationData,
      createdAt: Timestamp.now(),
    });
    console.log("Notification added successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding notification:", error);
    throw new Error("Failed to add notification.");
  }
};

/**
 * Fetches all notifications.
 * @returns {Promise<Notification[]>} List of notifications.
 */
export const getAllNotifications = async (): Promise<Notification[]> => {
  try {
    const notificationsSnapshot = await getDocs(collection(db, "notifications"));
    return notificationsSnapshot.docs.map(doc => ({
      notificationId: doc.id,
      ...doc.data(),
    })) as Notification[];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Failed to fetch notifications.");
  }
};

/**
 * Updates a notification by ID.
 * @param {string} notificationId - The ID of the notification to update.
 * @param {Partial<Notification>} updateData - The data to update.
 * @returns {Promise<void>}
 */
export const updateNotification = async (notificationId: string, updateData: Partial<Notification>): Promise<void> => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, updateData);
    console.log("Notification updated successfully:", notificationId);
  } catch (error) {
    console.error("Error updating notification:", error);
    throw new Error("Failed to update notification.");
  }
};

/**
 * Deletes a notification by ID.
 * @param {string} notificationId - The ID of the notification to delete.
 * @returns {Promise<void>}
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "notifications", notificationId));
    console.log("Notification deleted successfully:", notificationId);
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw new Error("Failed to delete notification.");
  }
};

// ---------------------------
// Forms Management
// ---------------------------

/**
 * Submits a form.
 * @param {any} formData - The form data.
 * @returns {Promise<string>} The ID of the submitted form.
 */
export const submitForm = async (formData: any): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "submittedForms"), {
      ...formData,
      submittedAt: Timestamp.now(),
    });
    console.log("Form submitted successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error submitting form:", error);
    throw new Error("Failed to submit form.");
  }
};

/**
 * Fetches all submitted forms.
 * @returns {Promise<any[]>} List of submitted forms.
 */
export const getSubmittedForms = async (): Promise<any[]> => {
  try {
    const formsSnapshot = await getDocs(collection(db, "submittedForms"));
    return formsSnapshot.docs.map(doc => ({
      formId: doc.id,
      ...doc.data(),
      submittedAt: (doc.data().submittedAt as Timestamp).toDate(),
    }));
  } catch (error) {
    console.error("Error fetching submitted forms:", error);
    throw new Error("Failed to fetch submitted forms.");
  }
};

// ---------------------------
// Events Management
// ---------------------------

/**
 * Adds a new event.
 * @param {any} eventData - The event data.
 * @returns {Promise<string>} The ID of the newly created event.
 */
export const addEvent = async (eventData: { title: string; description: string; date: string }): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'events'), eventData);
    console.log("Event added successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding event:", error);
    throw error;
  }
};

/**
 * Fetches all events.
 * @returns {Promise<any[]>} List of events.
 */
export const getAllEvents = async (): Promise<any[]> => {
  try {
    const eventsSnapshot = await getDocs(collection(db, 'events'));
    return eventsSnapshot.docs.map(doc => ({
      eventId: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching events:", error);
    throw new Error("Failed to fetch events.");
  }
};

// ---------------------------
// Notifications (Optional)
// ---------------------------

// Additional methods related to notifications can be added here if needed.

// ---------------------------
// Faculties and Students (Additional Methods)
// ---------------------------
/**
 * Fetches all faculties from the 'users' collection where role == 'faculty'.
 * @returns {Promise<any[]>} List of faculties.
 */
export const getAllFaculties = async (): Promise<any[]> => {
  try {
    const usersRef = collection(db, 'users');
    const facultiesQuery = query(usersRef, where('role', '==', 'faculty'));
    const facultiesSnapshot = await getDocs(facultiesQuery);
    return facultiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching faculties:', error);
    throw new Error('Error fetching faculties');
  }
};
/**
 * Fetches all students from the 'users' collection where role == 'student'.
 * @returns {Promise<any[]>} List of students.
 */
export const getAllStudents = async (): Promise<any[]> => {
  try {
    const usersRef = collection(db, 'users');
    const studentsQuery = query(usersRef, where('role', '==', 'student'));
    const studentsSnapshot = await getDocs(studentsQuery);
    return studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching students:', error);
    throw new Error('Error fetching students');
  }
};

export const databaseService = {
  // User Management
  addUser,
  getUserData,
  getAllUsers,
  updateUser: deleteUserById,
  deleteUser,
  getNextUserId,
  
  // Appointments
  addAppointment,
  updateAppointment,
  cancelAppointment,
  getAppointments,
  getAllAppointments,
  
  // Facilities
  getAllFacilities,
  getFacilities,
  getAvailableSlots,
  bookFacility,
  getFacilityBookings,
  updateFacilityAvailability,
  
  // System Settings
  updateSystemSettings,
  getSystemSettings,
  
  // Facilities Settings
  updateFacilitiesSettings,
  getFacilitiesSettings,
  
  // Documents
  getDocuments,
  saveDocument,
  updateDocument,
  deleteDocument,
  
  // Notifications
  addNotification,
  getAllNotifications,
  updateNotification,
  deleteNotification,
  
  // Forms
  submitForm,
  getSubmittedForms,
  
  // Events
  addEvent,
  getAllEvents,
  
  // Users by Role
  getAllFaculties,
  getAllStudents
};