import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  setDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from "firebase/firestore";
import { firebaseApp } from "./firebase";

// Define Notification type with Firestore Timestamp
type Notification = {
  id: string;
  message: string;
  type: "info" | "alert" | "update" | "success" | "error";
  timestamp: Timestamp; // Firestore Timestamp
  userId?: string; // Optional userId for filtering notifications
  relatedFormId?: string; // Optional form linkage
  relatedAppointmentId?: string; // Added for appointment-specific notifications
};

class NotificationService {
  private listeners: Function[] = [];
  private db = getFirestore(firebaseApp);

  // Subscribe to notifications collection
  subscribe(listener: (notifications: Notification[]) => void): Function {
    const unsubscribe = onSnapshot(
      collection(this.db, "notifications"),
      (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          message: doc.data().message,
          type: doc.data().type,
          timestamp: doc.data().timestamp || Timestamp.now(),
          userId: doc.data().userId || "",
          relatedFormId: doc.data().relatedFormId || "",
          relatedAppointmentId: doc.data().relatedAppointmentId || "",
        })) as Notification[];

        if (!this.listeners.includes(listener)) {
          this.listeners.push(listener);
        }

        listener(notifications);
      }
    );

    return () => {
      this.unsubscribe(listener);
      unsubscribe();
    };
  }

  // Unsubscribe a specific listener
  unsubscribe(listener: Function) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  // Notify a user by adding a notification to Firestore
  async notify(notification: Omit<Notification, "id">): Promise<void> {
    try {
      const docRef = doc(collection(this.db, "notifications")); // Auto-generate ID
      await setDoc(docRef, {
        ...notification,
        timestamp: Timestamp.now(), // Use Firestore Timestamp
      });
    } catch (error) {
      console.error("Failed to add notification:", error);
      throw new Error("Failed to add notification");
    }
  }

  // Notify users about appointment updates
  async notifyAppointmentUpdate(
    userId: string,
    appointmentId: string,
    message: string,
    type: "info" | "alert" | "update" | "success" | "error"
  ): Promise<void> {
    try {
      await this.notify({
        userId,
        message,
        type,
        timestamp: Timestamp.now(),
        relatedAppointmentId: appointmentId, // Use appointmentId for reference
      });
      console.log("Appointment update notification sent.");
    } catch (error) {
      console.error("Failed to send appointment update notification:", error);
      throw new Error("Failed to send appointment update notification");
    }
  }

  // Fetch notifications for a specific user
  async getNotifications(userId: string): Promise<Notification[]> {
    const notificationsQuery = query(
      collection(this.db, "notifications"),
      where("userId", "==", userId)
    );

    try {
      const snapshot = await getDocs(notificationsQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        message: doc.data().message,
        type: doc.data().type,
        timestamp: doc.data().timestamp || Timestamp.now(),
        userId: doc.data().userId || "",
        relatedFormId: doc.data().relatedFormId || "",
        relatedAppointmentId: doc.data().relatedAppointmentId || "",
      })) as Notification[];
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      throw new Error("Failed to fetch notifications");
    }
  }

  // Notify users about form updates
  async notifyFormUpdate(
    userId: string,
    formId: string,
    message: string,
    type: "info" | "alert" | "update" | "success" | "error"
  ): Promise<void> {
    const notification: Omit<Notification, "id"> = {
      message,
      type,
      timestamp: Timestamp.now(),
      userId,
      relatedFormId: formId,
    };

    await this.notify(notification);
  }

  // Clear (delete) a notification
  async clearNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, "notifications", notificationId)); // Delete notification
    } catch (error) {
      console.error("Failed to delete notification:", error);
      throw new Error("Failed to delete notification");
    }
  }
}

export const notificationService = new NotificationService();
