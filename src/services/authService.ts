import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
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
  faculty?: string;
  profilePicture?: string;
}

const createCustomUser = (user: User, data: any): CustomUser => ({
  ...user,
  role: data.role || "student",
  name: data.name || "Unknown",
  faculty: data.faculty || "",
  profilePicture: data.profilePicture || "",
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

  // Listen for authentication state changes
  onAuthStateChanged: (callback: (user: CustomUser | null) => void): void => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const authenticatedUser: CustomUser = createCustomUser(user, userData);
            console.log("Authentication state changed: User is authenticated", authenticatedUser);
            callback(authenticatedUser);
          } else {
            callback(null);
          }
        } catch (error) {
          console.error("Error during authentication state change:", error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },

  // Get current authenticated user
  getCurrentUser: async (): Promise<CustomUser | null> => {
    if (auth.currentUser) {
      try {
        const currentUser = auth.currentUser;
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return createCustomUser(currentUser, userData);
        } else {
          return null;
        }
      } catch (error) {
        console.error("Error retrieving current user data:", error);
        throw new Error("Failed to retrieve current user data.");
      }
    }

    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            resolve(createCustomUser(user, userData));
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  },

  // Update user profile
  updateUserProfile: async (updatedData: { name?: string; email?: string; faculty?: string }): Promise<void> => {
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
  changeUserPassword: async (currentPassword: string, newPassword: string): Promise<void> => {
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
        return createCustomUser(auth.currentUser!, data);
      });
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw new Error("Failed to fetch all users.");
    }
  },
};

export const { getCurrentUser, updateUserProfile, changeUserPassword } = authService;
