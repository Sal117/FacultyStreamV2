import { Timestamp } from 'firebase/firestore';

export interface Notification {
  id: string;
  message: string;
  type: "info" | "alert" | "update" | "success" | "error";
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

export type NotificationPayload = Omit<Notification, "id" | "read">;
