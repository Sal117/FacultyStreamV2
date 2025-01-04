// src/services/announcementService.ts

import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  Timestamp,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { firebaseApp } from './firebase';
import { Announcement } from '../components/types';

const db = getFirestore(firebaseApp);

class AnnouncementService {
  // Add a new announcement
  async addAnnouncement(
    announcementData: Omit<Announcement, 'announcementId' | 'createdAt'>
  ): Promise<string> {
    try {
      const dataWithTimestamp = {
        ...announcementData,
        createdAt: Timestamp.now(),
        ...(announcementData.date && { date: Timestamp.fromDate(announcementData.date) }),
      };
      const docRef = await addDoc(collection(db, 'announcements'), dataWithTimestamp);
      console.log('Announcement added successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding announcement:', error);
      throw new Error('Failed to add announcement.');
    }
  }

  // Get all announcements
  async getAllAnnouncements(): Promise<Announcement[]> {
    try {
      const announcementsQuery = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc')
      );
      const announcementsSnapshot = await getDocs(announcementsQuery);
      return announcementsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          announcementId: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp).toDate(),
          date: data.date ? (data.date as Timestamp).toDate() : undefined,
        } as Announcement;
      });
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw new Error('Failed to fetch announcements.');
    }
  }

  // Update an announcement by ID
  async updateAnnouncement(
      announcementId: string,
      updateData: Partial<Announcement>
    ): Promise<void> {
      try {
        const announcementRef = doc(db, 'announcements', announcementId);
        const dataToUpdate: any = {
          ...updateData,
          ...(updateData.date && { date: Timestamp.fromDate(updateData.date) }),
        };
    
        // Handle null date
        if (updateData.date === null) {
          dataToUpdate.date = null;
        }
    
        await updateDoc(announcementRef, dataToUpdate);
        console.log('Announcement updated successfully:', announcementId);
      } catch (error) {
        console.error('Error updating announcement:', error);
        throw new Error('Failed to update announcement.');
      }
    }

  // Delete an announcement by ID
  async deleteAnnouncement(announcementId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'announcements', announcementId));
      console.log('Announcement deleted successfully:', announcementId);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw new Error('Failed to delete announcement.');
    }
  }

  // Subscribe to announcements with real-time updates
  subscribeToAnnouncements(callback: (announcements: Announcement[]) => void): () => void {
    const announcementsQuery = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(announcementsQuery, (snapshot) => {
      const announcements = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          announcementId: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp).toDate(),
          date: data.date ? (data.date as Timestamp).toDate() : undefined,
        } as Announcement;
      });
      callback(announcements);
    });

    return unsubscribe;
  }

  // Get a single announcement by ID
  async getAnnouncementById(announcementId: string): Promise<Announcement | null> {
    try {
      const docRef = doc(db, 'announcements', announcementId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          announcementId: docSnap.id,
          ...data,
          createdAt: (data.createdAt as Timestamp).toDate(),
          date: data.date ? (data.date as Timestamp).toDate() : undefined,
        } as Announcement;
      } else {
        console.log('No such announcement!');
        return null;
      }
    } catch (error) {
      console.error('Error getting announcement:', error);
      throw new Error('Failed to get announcement.');
    }
  }
}

export const announcementService = new AnnouncementService();

export type { Announcement };
