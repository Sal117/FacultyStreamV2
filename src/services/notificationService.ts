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
import { Notification, NotificationPayload, FirestoreNotification } from '../types/notification';

class NotificationService {
  private listeners: Function[] = [];
  private db = getFirestore(firebaseApp);

  // Helper function to remove undefined fields
  private removeUndefinedFields(obj: any): any {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
  }

  // Convert Firestore timestamp to Date
  private convertTimestampToDate(timestamp: Timestamp): Date {
    return timestamp.toDate();
  }

  // Subscribe to notifications collection
  subscribe(listener: (notifications: Notification[]) => void): Function {
    const unsubscribe = onSnapshot(
      collection(this.db, "notifications"),
      (snapshot) => {
        const notifications = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            message: data.message,
            type: data.type,
            timestamp: this.convertTimestampToDate(data.timestamp || Timestamp.now()),
            recipientId: data.recipientId || "",
            read: data.read ?? false,
            relatedFormId: data.relatedFormId,
            relatedAppointmentId: data.relatedAppointmentId,
            relatedConversationId: data.relatedConversationId,
          } as Notification;
        });

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

  // Subscribe to user's notifications
  listenToNotifications(userId: string, callback: (notifications: FirestoreNotification[]) => void) {
    const q = query(
      collection(this.db, "notifications"),
      where("recipientId", "==", userId),
      orderBy("timestamp", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          message: data.message,
          type: data.type,
          timestamp: data.timestamp,
          recipientId: data.recipientId,
          read: data.read ?? false,
          relatedFormId: data.relatedFormId,
          relatedAppointmentId: data.relatedAppointmentId,
          relatedConversationId: data.relatedConversationId,
        } as FirestoreNotification;
      });
      
      callback(notifications);
    });
  }

  // Notify a user by adding a notification to Firestore
  async notify(notificationData: Omit<NotificationPayload, "timestamp">): Promise<string> {
    try {
      const docRef = doc(collection(this.db, "notifications"));
      const dataToSet = {
        ...notificationData,
        read: false,
        timestamp: Timestamp.now()
      };
      await setDoc(docRef, dataToSet);
      return docRef.id;
    } catch (error) {
      console.error("Failed to add notification:", error);
      throw new Error("Failed to add notification");
    }
  }

  // Notify users about appointment updates
  async notifyAppointmentUpdate(
    recipientId: string,
    appointmentId: string,
    message: string,
    type: Notification["type"]
  ): Promise<string> {
    const notificationData = {
      recipientId,
      message,
      type,
      relatedAppointmentId: appointmentId
    };
    return this.notify(notificationData);
  }

  // Notify users about form updates
  async notifyFormUpdate(
    recipientId: string,
    formId: string,
    message: string,
    type: Notification["type"]
  ): Promise<string> {
    const notificationData = {
      recipientId,
      message,
      type,
      relatedFormId: formId
    };
    return this.notify(notificationData);
  }

  // Notify a list of users (bulk notification)
  async notifyUsers(
    recipientIds: string[], 
    message: string,
    type: Notification["type"],
    relatedFormId?: string,
    relatedAppointmentId?: string
  ): Promise<void> {
    try {
      const promises = recipientIds.map(recipientId => 
        this.notify(this.removeUndefinedFields({
          recipientId,
          message,
          type,
          relatedFormId,
          relatedAppointmentId
        }))
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Failed to send bulk notifications:", error);
      throw new Error("Failed to send bulk notifications");
    }
  }

  // Clear (delete) a notification
  async clearNotification(notificationId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, "notifications", notificationId));
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
      await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
    } catch (error) {
      console.error("Failed to clear user notifications:", error);
      throw new Error("Failed to clear user notifications");
    }
  }
}

export const notificationService = new NotificationService();
