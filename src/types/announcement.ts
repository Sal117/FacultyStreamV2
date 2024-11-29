import { Timestamp } from 'firebase/firestore';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  type: 'general' | 'event';
  date?: Date;
  imageUrl?: string;
  attachments?: string[];
  links?: { label: string; url: string }[];
}

export interface FirestoreAnnouncement extends Omit<Announcement, 'createdAt' | 'date'> {
  createdAt: Timestamp;
  date?: Timestamp;
}
