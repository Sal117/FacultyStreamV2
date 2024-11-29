// src/services/chatService.ts

import { db, auth } from '../services/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  Unsubscribe,
  DocumentData,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { ChatMessage, Conversation, ChatUser } from '../components/types';
import { notificationService } from './notificationService';


// Collection references
const conversationsCollection = collection(db, 'conversations');
const messagesCollection = collection(db, 'messages');
const usersCollection = collection(db, 'users');

// Function to get or create a conversation between two users
export const getOrCreateConversation = async (
  userId1: string,
  userId2: string
): Promise<Conversation> => {
  try {
    // Check if conversation already exists
    const convQuery = query(
      conversationsCollection,
      where('participants', 'in', [
        [userId1, userId2],
        [userId2, userId1],
      ])
    );
    const querySnapshot = await getDocs(convQuery);

    if (!querySnapshot.empty) {
      // Conversation exists
      const convDoc = querySnapshot.docs[0];
      const data = convDoc.data();
      return {
        conversationId: convDoc.id,
        participants: data.participants,
        lastMessage: data.lastMessage,
        updatedAt: data.updatedAt.toDate(),
      };
    } else {
      // Create new conversation
      const convData = {
        participants: [userId1, userId2],
        updatedAt: serverTimestamp(),
      };
      const convDocRef = await addDoc(conversationsCollection, convData);
      return {
        conversationId: convDocRef.id,
        participants: [userId1, userId2],
        updatedAt: new Date(),
      };
    }
  } catch (error) {
    console.error('Error getting or creating conversation:', error);
    throw error;
  }
};

// Function to send a message in a conversation
export const sendMessage = async (
    conversationId: string,
    content: string,
    attachments: string[] = []
  ): Promise<void> => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('User is not authenticated');
        }
    
        // Fetch current user's data to get name and profilePicture
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
    
        const messageData: Omit<ChatMessage, 'messageId'> = {
          conversationId,
          senderId: currentUser.uid,
          senderName: userData.name || 'Anonymous',
          senderAvatarUrl: userData.profilePicture || '',
          content,
          timestamp: serverTimestamp() as any,
          reactions: {},
          attachments,
          status: 'delivered',
        };
    
        // Add message to messages collection
        const messageDocRef = await addDoc(messagesCollection, messageData);
    
        // Update conversation's last message and updatedAt
        const conversationRef = doc(db, 'conversations', conversationId);
        await updateDoc(conversationRef, {
          lastMessage: {
            ...messageData,
            messageId: messageDocRef.id,
            timestamp: Timestamp.now(),
          },
          updatedAt: serverTimestamp(),
        });
    
        // Fetch conversation data to get recipient ID
        const conversationDoc = await getDoc(conversationRef);
        const conversationData = conversationDoc.data();
        const participants: string[] = conversationData?.participants || [];
    
        // Determine recipient ID
        const recipientId = participants.find((id) => id !== currentUser.uid);
    
        if (recipientId) {
          // Notify the recipient about the new message
          await notificationService.notifyNewMessage(
            recipientId,
            conversationId,
            content
          );
        }
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    };

    export const getConversationById = async (
        conversationId: string
      ): Promise<Conversation | null> => {
        try {
          const convDocRef = doc(db, 'conversations', conversationId);
          const convDoc = await getDoc(convDocRef);
          if (convDoc.exists()) {
            const data = convDoc.data();
            return {
              conversationId: convDoc.id,
              participants: data.participants,
              lastMessage: data.lastMessage,
              updatedAt: data.updatedAt.toDate(),
            };
          } else {
            return null;
          }
        } catch (error) {
          console.error('Error getting conversation by ID:', error);
          throw error;
        }
      };
      
  

// Function to subscribe to messages in a conversation
export const subscribeToConversationMessages = (
    conversationId: string,
    callback: (messages: ChatMessage[]) => void
  ): Unsubscribe => {
    const messagesQuery = query(
      messagesCollection,
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );
  
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData;
        return {
          messageId: doc.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
          senderName: data.senderName,
          senderAvatarUrl: data.senderAvatarUrl || '', // Include this field
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
          reactions: data.reactions || {},
          attachments: data.attachments || [],
          status: data.status || 'delivered',
        };
      });
      callback(messages);
    });
  
    return unsubscribe;
  };
  

// Function to get all users
export const getAllChatUsers = async (): Promise<ChatUser[]> => {
    try {
      const querySnapshot = await getDocs(usersCollection);
      const users: ChatUser[] = [];
  
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          userId: doc.id,
          userName: data.name || 'Anonymous',
          avatarUrl: data.profilePicture || '', // Fetching profilePicture
          role: data.role || 'student',
          lastSeen: data.lastSeen?.toDate() || new Date(),
        });
      });
  
      return users;
    } catch (error) {
      console.error('Error fetching chat users:', error);
      throw error;
    }
  };

// Function to get all conversations for the current user
export const getUserConversations = async (): Promise<Conversation[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User is not authenticated');
    }

    const convQuery = query(
      conversationsCollection,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(convQuery);

    const conversations: Conversation[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        conversationId: doc.id,
        participants: data.participants,
        lastMessage: data.lastMessage,
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });

    return conversations;
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    throw error;
  }
};
