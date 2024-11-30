import { Timestamp } from 'firebase/firestore';

export type AnnouncementType = 'announcement' | 'event' | 'general';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  date: Date;
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  imageUrl?: string;
  attachments: string[];
  links: {
    title: string;
    url: string;
  }[];
}

export interface FirestoreAnnouncement extends Omit<Announcement, 'date' | 'createdAt'> {
  date: Timestamp;
  createdAt: Timestamp;
}

export type AnnouncementPayload = Omit<Announcement, 'id' | 'createdAt' | 'createdBy'>;
