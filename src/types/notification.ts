import { Timestamp } from 'firebase/firestore';

export interface Notification {
  id: string;
  message: string;
  type: "info" | "alert" | "update" | "success" | "error";
  timestamp: Date | Timestamp;
  recipientId: string;
  read: boolean;
  relatedFormId?: string;
  relatedAppointmentId?: string;
  relatedConversationId?: string;
}

export type NotificationPayload = Omit<Notification, "id" | "read">;
