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
import { Notification, NotificationPayload } from '../types/notification';

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
  async notify(notification: Omit<NotificationPayload, "timestamp">): Promise<string> {
    try {
      const docRef = doc(collection(this.db, "notifications"));
      const timestamp = Timestamp.now();
      const dataToSet = {
        ...notification,
        read: false,
        timestamp,
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
    return this.notify({
      recipientId,
      message,
      type,
      relatedAppointmentId: appointmentId,
      timestamp: Timestamp.now(),
    });
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
        timestamp: this.convertTimestampToDate(doc.data().timestamp),
        recipientId: doc.data().recipientId,
        read: doc.data().read ?? false,
        relatedFormId: doc.data().relatedFormId,
        relatedAppointmentId: doc.data().relatedAppointmentId,
        relatedConversationId: doc.data().relatedConversationId,
      }));
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

  // Notify users about appointment status changes
  async notifyAppointmentStatusChange(
    recipientId: string,
    appointmentId: string,
    newStatus: 'accepted' | 'rejected' | 'cancelled' | 'rescheduled',
    appointmentDetails: {
      date: Date;
      startTime: string;
      endTime: string;
      meetingType?: 'online' | 'physical';
      meetingLink?: string;
      facilityId?: string;
    }
  ): Promise<void> {
    let message = '';
    let type: "info" | "alert" | "update" | "success" | "error" = "info";

    const dateStr = appointmentDetails.date.toLocaleDateString();
    const timeStr = `${appointmentDetails.startTime} - ${appointmentDetails.endTime}`;
    const locationStr = appointmentDetails.meetingType === 'online' 
      ? `Online meeting link: ${appointmentDetails.meetingLink}`
      : `Facility ID: ${appointmentDetails.facilityId}`;

    switch (newStatus) {
      case 'accepted':
        message = `Your appointment on ${dateStr} at ${timeStr} has been accepted. ${locationStr}`;
        type = "success";
        break;
      case 'rejected':
        message = `Your appointment on ${dateStr} at ${timeStr} has been rejected.`;
        type = "error";
        break;
      case 'cancelled':
        message = `Your appointment on ${dateStr} at ${timeStr} has been cancelled.`;
        type = "alert";
        break;
      case 'rescheduled':
        message = `Your appointment has been rescheduled to ${dateStr} at ${timeStr}. ${locationStr}`;
        type = "update";
        break;
    }

    await this.notify({
      recipientId,
      message,
      type,
      relatedAppointmentId: appointmentId,
      timestamp: Timestamp.now(),
    });
  }

  // Notify users about new appointment requests
  async notifyNewAppointmentRequest(
    recipientId: string,
    appointmentId: string,
    requesterName: string,
    appointmentDetails: {
      date: Date;
      startTime: string;
      endTime: string;
    }
  ): Promise<void> {
    const dateStr = appointmentDetails.date.toLocaleDateString();
    const timeStr = `${appointmentDetails.startTime} - ${appointmentDetails.endTime}`;
    
    await this.notify({
      recipientId,
      message: `New appointment request from ${requesterName} for ${dateStr} at ${timeStr}`,
      type: "info",
      relatedAppointmentId: appointmentId,
      timestamp: Timestamp.now(),
    });
  }

  // Remind users about upcoming appointments
  async sendAppointmentReminder(
    recipientId: string,
    appointmentId: string,
    appointmentDetails: {
      date: Date;
      startTime: string;
      endTime: string;
      meetingType?: 'online' | 'physical';
      meetingLink?: string;
      facilityId?: string;
    }
  ): Promise<void> {
    const dateStr = appointmentDetails.date.toLocaleDateString();
    const timeStr = `${appointmentDetails.startTime} - ${appointmentDetails.endTime}`;
    const locationStr = appointmentDetails.meetingType === 'online' 
      ? `Join online: ${appointmentDetails.meetingLink}`
      : `Location: Facility ${appointmentDetails.facilityId}`;

    await this.notify({
      recipientId,
      message: `Reminder: You have an appointment tomorrow at ${timeStr}. ${locationStr}`,
      type: "info",
      relatedAppointmentId: appointmentId,
      timestamp: Timestamp.now(),
    });
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

  // Create a new notification
  async createNotification(notification: Omit<Notification, "id" | "timestamp">): Promise<string> {
    try {
      const notificationWithDate = {
        ...notification,
        timestamp: Timestamp.now(),
      };

      const docRef = await setDoc(doc(collection(this.db, "notifications")), notificationWithDate);
      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  private convertTimestampToDate(timestamp: Timestamp): Date {
    return timestamp.toDate();
  }
}

export const notificationService = new NotificationService();
