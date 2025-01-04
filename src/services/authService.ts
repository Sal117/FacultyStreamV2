// src/services/authService.ts

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
  updatePassword as firebaseUpdatePassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { firebaseApp } from "./firebase";

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export interface CustomUser extends User {
  role: "student" | "faculty" | "admin";
  name?: string;
  address?: string;
  faculty?: string;
  DOB?: string;
  phoneNumber: string; // User's phone number
  profilePicture?: string;
  isActive?: boolean; // Whether the user is active
  Id?:string;
  generatedId?:string;

}

// src/services/authService.ts

const createCustomUser = (user: User, data: any): CustomUser => ({
  ...user, // Include all properties of the Auth user object
  role: data.role || "student", // Default to "student" if role is not provided
  name: data.name || "Unknown", // Default to "Unknown" if name is not provided
  faculty: data.faculty || "", // Default to an empty string if faculty is not provided
  profilePicture: data.profilePicture || "", // Default to an empty string if no profile picture
  phoneNumber: data.phoneNumber || "", // Default to an empty string if phone number is not provided
  address: data.address || "", // Default to an empty string if address is not provided
  DOB: data.DOB || "", // Default to an empty string if DOB is not provided
  isActive: data.isActive !== undefined ? data.isActive : true, // Default to `true` if not provided
  Id: data.Id || "", // Include Id if available
  generatedId: data.generatedId || "", // Include generatedId if available
});


export const authService = {
  // User login
  login: async (email: string, password: string): Promise<CustomUser | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const loggedInUser: CustomUser = createCustomUser(user, userData);
        console.log("User successfully logged in:", loggedInUser);
        return loggedInUser;
      } else {
        throw new Error("User document not found in Firestore.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw new Error("Login failed. Please check your email and password.");
    }
  },

  // User logout
  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
      console.log("User successfully logged out.");
    } catch (error) {
      console.error("Logout error:", error);
      throw new Error("Logout failed. Please try again.");
    }
  },

  // Listen for authentication state changes and return unsubscribe function
  onAuthStateChanged: (
    callback: (user: CustomUser | null) => void
  ): (() => void) => {
    return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
      console.log("firebaseOnAuthStateChanged called with firebaseUser:", firebaseUser);
      if (firebaseUser) {
        // Fetch the user's Firestore document
        getDoc(doc(db, "users", firebaseUser.uid))
          .then((userDoc) => {
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const authenticatedUser: CustomUser = createCustomUser(
                firebaseUser,
                userData
              );
              console.log(
                "Authentication state changed: User is authenticated",
                authenticatedUser
              );
              callback(authenticatedUser);
            } else {
              console.warn("User document does not exist in Firestore.");
              callback(null);
            }
          })
          .catch((error) => {
            console.error("Error retrieving user document:", error);
            callback(null);
          });
      } else {
        console.log("User is signed out.");
        callback(null);
      }
    });
  },

  // Get current authenticated user
  getCurrentUser: async (): Promise<CustomUser | null> => {
    if (auth.currentUser) {
      try {
        const currentUser = auth.currentUser;

        // Fetch the user's Firestore document
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Merge Auth data with Firestore data
          return createCustomUser(currentUser, userData);
        } else {
          console.warn("User document does not exist in Firestore.");
          return null;
        }
      } catch (error) {
        console.error("Error retrieving current user data:", error);
        throw new Error("Failed to retrieve current user data.");
      }
    }

    // Handle cases where auth.currentUser is null
    return new Promise((resolve) => {
      const unsubscribe = firebaseOnAuthStateChanged(auth, async (user) => {
        unsubscribe(); // Unsubscribe from the listener
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();

              // Merge Auth data with Firestore data
              resolve(createCustomUser(user, userData));
            } else {
              console.warn("User document does not exist in Firestore.");
              resolve(null);
            }
          } catch (error) {
            console.error("Error retrieving user document:", error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  },

  // Update user profile
  updateUserProfile: async (updatedData: {
    name?: string;
    email?: string;
    faculty?: string;
    phoneNumber?: string; // Add phoneNumber
    address?: string; // Add address
    profilePicture?: string | null;
    DOB?: string;
  }): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No user is currently logged in.");
    }
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, updatedData);
      console.log("User profile successfully updated.");
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw new Error("Failed to update user profile.");
    }
  },

  // Change user password
  changeUserPassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      throw new Error("No user is logged in or email is unavailable.");
    }
    try {
      await signInWithEmailAndPassword(auth, currentUser.email, currentPassword);
      await firebaseUpdatePassword(currentUser, newPassword);
      console.log("Password successfully updated.");
    } catch (error) {
      console.error("Error updating password:", error);
      throw new Error("Failed to update password.");
    }
  },

  // Send a password reset email
  resetUserPassword: async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log(`Password reset email sent to ${email}.`);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw new Error("Failed to send password reset email.");
    }
  },

 // Fetch all users
getAllUsers: async (): Promise<CustomUser[]> => {
  try {
    const usersCollection = collection(db, "users");
    const querySnapshot = await getDocs(usersCollection);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      // Add uid (document ID) to the user object without altering existing logic
      const customUser = createCustomUser(auth.currentUser!, data);
      return {
        ...customUser,
        uid: doc.id, // Add document ID (uid) explicitly
      };
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw new Error("Failed to fetch all users.");
  }
},

};

export const { getCurrentUser, updateUserProfile, changeUserPassword } = authService;
