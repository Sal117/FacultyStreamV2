//src/types/announcement.ts
import { Timestamp } from 'firebase/firestore';

export type AnnouncementType = 'announcement' | 'event' ;

export interface Announcement {
  announcementId: string;
  title: string;
  content: string;
  type: AnnouncementType;
  date?: Date | null;
  createdAt: Date;
  createdByUid: string;
  createdByName: string;
  imageUrl?: string;
  attachments?: string[];
  links?: {
    label: string;
    url: string;
  }[];
}

export interface FirestoreAnnouncement extends Omit<Announcement, 'date' | 'createdAt'> {
  date: Timestamp;
  createdAt: Timestamp;
}

export type AnnouncementPayload = Omit<Announcement, 'id' | 'createdAt' | 'createdBy'>;
