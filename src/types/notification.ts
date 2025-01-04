// src/types/notification.ts
import { Timestamp } from 'firebase/firestore';

export type NotificationType = 'info' | 'alert' | 'update' | 'success' | 'error';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  recipientId: string;
  read?: boolean; // Made optional
  relatedFormId?: string;
  relatedAppointmentId?: string;
  relatedConversationId?: string;
}

export interface FirestoreNotification extends Omit<Notification, 'timestamp'> {
  timestamp: Timestamp;
}

export interface NotificationPayload extends Omit<Notification, 'id'> {
  // Removed 'read' from the omit list
}
