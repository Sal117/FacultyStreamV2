// src/services/notificationService.ts

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
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { firebaseApp } from "./firebase";

// Define Notification type with Firestore Timestamp
export type Notification = {
  id: string;
  message: string;
  type: "info" | "alert" | "update" | "success" | "error";
   timestamp:  Timestamp; // Firestore Timestamp
  recipientId: string; 
  relatedFormId?: string; 
  relatedAppointmentId?: string; 
  relatedConversationId?: string; 
  read?: boolean
};

class NotificationService {
  private listeners: Function[] = [];
  private db = getFirestore(firebaseApp);

  // Helper function to remove undefined fields
  private removeUndefinedFields(obj: any): any {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
  }

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
          recipientId: doc.data().recipientId || "",
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
      const dataToSet = this.removeUndefinedFields({
        ...notification,
        timestamp: Timestamp.now(), // Use Firestore Timestamp
      });
      await setDoc(docRef, dataToSet);
    } catch (error) {
      console.error("Failed to add notification:", error);
      throw new Error("Failed to add notification");
    }
  }

  // Notify users about appointment updates
  async notifyAppointmentUpdate(
    recipientId: string, // Changed from userId to recipientId
    appointmentId: string,
    message: string,
    type: "info" | "alert" | "update" | "success" | "error"
  ): Promise<void> {
    try {
      await this.notify({
        recipientId,
        message,
        type,
        relatedAppointmentId: appointmentId,
        timestamp: Timestamp.now(),  
      });
      console.log("Appointment update notification sent.");
    } catch (error) {
      console.error("Failed to send appointment update notification:", error);
      throw new Error("Failed to send appointment update notification");
    }
  }

  // Fetch notifications for a specific user
  async getNotifications(recipientId: string): Promise<Notification[]> {
    const notificationsQuery = query(
      collection(this.db, "notifications"),
      where("recipientId", "==", recipientId)
    );

    try {
      const snapshot = await getDocs(notificationsQuery);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        message: doc.data().message,
        type: doc.data().type,
        timestamp: doc.data().timestamp
      ? doc.data().timestamp.toDate()
      : new Date(),
        recipientId: doc.data().recipientId || "",
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
    recipientId: string,
    formId: string,
    message: string,
    type: "info" | "alert" | "update" | "success" | "error"
  ): Promise<void> {
    const notification: Omit<Notification, "id"> = {
      message,
      type,
      timestamp: Timestamp.now(),
      recipientId,
      relatedFormId: formId,
    };

    await this.notify(notification);
  }

  // Notify a list of users (bulk notification)
  async notifyUsers(
    recipientIds: string[],
    message: string,
    type: "info" | "alert" | "update" | "success" | "error",
    relatedFormId?: string,
    relatedAppointmentId?: string
  ): Promise<void> {
    try {
      for (const recipientId of recipientIds) {
        await this.notify(this.removeUndefinedFields({
          recipientId,
          message,
          type,
          relatedFormId,
          relatedAppointmentId,
        }));
      }
    } catch (error) {
      console.error("Failed to send bulk notifications:", error);
      throw new Error("Failed to send bulk notifications");
    }
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

  // Clear all notifications for a user
  async clearUserNotifications(recipientId: string): Promise<void> {
    try {
      const notificationsQuery = query(
        collection(this.db, "notifications"),
        where("recipientId", "==", recipientId)
      );

      const snapshot = await getDocs(notificationsQuery);

      const deletePromises = snapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );

      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Failed to clear user notifications:", error);
      throw new Error("Failed to clear user notifications");
    }
  }

  // Notify users about new chat messages
  async notifyNewMessage(
    recipientId: string,
    conversationId: string,
    messageContent: string
  ): Promise<void> {
    const notification: Omit<Notification, "id"> = {
      message: `New message: ${messageContent}`,
      type: "info",
      timestamp: Timestamp.now(),
      recipientId,
      relatedConversationId: conversationId,
    };

    await this.notify(notification);
  }




  // Subscribe to notifications for a specific user
  subscribeToUserNotifications(
    recipientId: string,
    callback: (notifications: Notification[]) => void
  ): () => void {
    const q = query(
      collection(this.db, "notifications"),
      where("recipientId", "==", recipientId),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: Notification[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        message: doc.data().message,
        type: doc.data().type,
        timestamp: doc.data().timestamp || Timestamp.now(),
        relatedFormId: doc.data().relatedFormId,
        relatedAppointmentId: doc.data().relatedAppointmentId,
        recipientId:doc.data().recipientId,
      }));
      callback(notifications);
    });

    return unsubscribe;
  }
}

export const notificationService = new NotificationService();
