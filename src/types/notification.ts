import { Timestamp } from 'firebase/firestore';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  recipientId: string;
  read: boolean;
  relatedFormId?: string;
  relatedAppointmentId?: string;
  relatedConversationId?: string;
}

export interface FirestoreNotification extends Omit<Notification, 'timestamp'> {
  timestamp: Timestamp;
}

export interface NotificationPayload extends Omit<Notification, 'id' | 'read'> {
  timestamp: Date;
}

export type NotificationType = "info" | "alert" | "update" | "success" | "error";
