// src/services/announcementService.ts

import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  Timestamp, 
  query, 
  orderBy, 
  onSnapshot, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Announcement } from '../components/types';

class AnnouncementService {
  private announcementsRef = collection(db, 'announcements');

  // Convert Firestore data to Announcement type
  private convertToAnnouncement(data: any, id: string): Announcement {
    return {
      announcementId: id,
      title: data.title,
      content: data.content,
      createdByUid: data.createdByUid,
      createdByName: data.createdByName,
      createdAt: data.createdAt?.toDate() || new Date(),
      type: data.type || 'announcement',
      date: data.date?.toDate() || null,
      imageUrl: data.imageUrl,
      attachments: data.attachments || [],
      links: data.links || []
    };
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    try {
      const q = query(this.announcementsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => 
        this.convertToAnnouncement(doc.data(), doc.id)
      );
    } catch (error) {
      console.error('Error getting announcements:', error);
      throw error;
    }
  }

  async createAnnouncement(announcementData: Omit<Announcement, 'announcementId' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await addDoc(this.announcementsRef, {
        ...announcementData,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }

  async updateAnnouncement(id: string, data: Partial<Announcement>): Promise<void> {
    try {
      const docRef = doc(this.announcementsRef, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  }

  async deleteAnnouncement(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.announcementsRef, id));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  }

  subscribeToAnnouncements(callback: (announcements: Announcement[]) => void): () => void {
    const q = query(this.announcementsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const announcements = snapshot.docs.map(doc => 
        this.convertToAnnouncement(doc.data(), doc.id)
      );
      callback(announcements);
    }, (error) => {
      console.error('Error in announcements subscription:', error);
    });
  }
}

export const announcementService = new AnnouncementService();