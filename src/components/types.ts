//src/components/types.ts
import { Timestamp } from "firebase/firestore";
// Define the User type
export interface User {
  
    userId: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  }
  
  // Define the Appointment type
  export interface Appointment {
    details?: string;
    appointmentId: string;
    userId: string; // ID of the user booking the appointment
    faculty: string; // ID of the faculty member involved
    room: string; // Room name or ID
    date: Date; // Appointment date and time in ISO format
    reason?: string; // Reason for the appointment
    status: "pending" | "confirmed" | "cancelled" | "rejected"; // Appointment status
    meetingLink?: string; // Optional Google Meet or online meeting link
    userName?: string; // Add this line
  }
 export interface Document {
    documentId: string;
    title: string;
    description: string;
    fileUrl: string;
    category: string;
    createdAt: string;
    createdBy: string;
  }
  export interface FormField {
    label: string;
    type: string;
    validation?: string[];
    required?: boolean;
    options?: string[];
    description?: string;
    
  }
  
  export interface FormTemplate {
    id: string;
    name: string;
    description: string;
    fields?:  { [key: string]: any };
    studentFields:  { [key: string]: any };
    facultyFields:  { [key: string]: any };
    createdAt: Date;
    createdBy: string;
    responsibleParties: string[];
    availableToStudents?: boolean;
    updatedAt?: Timestamp;
    responsiblePartyNames?: string[];
  }

  // Original SubmittedForm interface using Timestamp
export interface SubmittedFormOriginal {
  formID: string;
  formTemplateId: string;
  formType: string;
  submittedAt: Timestamp;
  submittedBy: string;
  responsibleParties: string[];
  status: "pending" | "approved" | "rejected";
  comments?: string;
  facultyData?: any;
  [key: string]: any;
}

// New SubmittedForm type for frontend usage with Date
export interface SubmittedFormFrontend {
  formID: string;
  formTemplateId: string;
  formType: string;
  submittedAt: Date; // Changed from Timestamp to Date
  submittedBy: string;
  responsibleParties: string[];
  status: "pending" | "approved" | "rejected";
  comments?: string;
  facultyData?: any;
  [key: string]: any;
}
export interface SubmittedForm {
  formID: string;
  formTemplateId: string;
  formType: string;
  submittedAt: Date; // Use Date for frontend
  submittedBy: string;
  responsibleParties: string[];
  status: "pending" | "approved" | "rejected";
  comments?: string;
  facultyData?: any;
  resubmittedAt?: Date; // Changed from Timestamp to Date
  resubmissionCount?: number;
  [key: string]: any;
}
  export interface SubmittedFormData {
    formTemplateId: string; // ID of the form template
    submittedBy: string; // UID of the student submitting the form
    submittedAt: Date; // Firestore timestamp of form submission
    status: "pending" | "approved" | "rejected"; // Status of the form
    responsibleParties: string[]; // Array of user IDs responsible for reviewing the form
    [key: string]: any; // Allow dynamic form fields (optional)
    formType: string;
  }
  export interface NotificationPayload {
    id: string;
    message: string;
    type: "info" | "alert" | "update" | "success" | "error";
    timestamp: Date;
    recipientId?: string;
    relatedFormId?: string;
    relatedAppointmentId?: string;
    relatedConversationId?: string;
    read?: boolean; // Added read property
  }
  


  export interface GlobalSettings {
    siteTitle: string;
    maintenanceMode: boolean;
    allowedFileTypes: string[];
    maxUploadSizeMB: number;
  }
  
  export interface FeatureToggle {
    featureId: string;
    name: string;
    enabled: boolean;
    description?: string;
  }

  ////////////Chating InterFace//////////////////////////////

  export interface ChatMessage {
    messageId: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderAvatarUrl?: string;
    content: string;
    timestamp: Date;
    reactions?: { [key: string]: number };
    attachments?: string[];
    status?: "delivered" | "seen";
  }

  export interface Conversation {
    conversationId: string;
    participants: string[]; // Array of userIds (should contain exactly two userIds for private chats)
    lastMessage?: ChatMessage;
    updatedAt: Date;
  }
  
  export type Message = ChatMessage;
  
  export interface ChatUser {
    userId: string; // Unique ID for the user
    userName: string; // Display name
    avatarUrl?: string; // URL for the user's profile picture
    role?: string; // Optional role (e.g., "admin", "student", "faculty")
    lastSeen?: Date; // Optional timestamp for the last seen status
  }
  
  export interface ChatRoom {
    roomId: string; // Unique ID for the chat room
    roomName: string; // Name of the chat room
    description?: string; // Optional description of the room
    participants: string[]; // List of user IDs participating in the room
  }
  

  //////////////////////////announcement AND Event interface///////////////////

  export interface Announcement {
    announcementId: string;
    title: string;
    content: string;
    createdByUid: string; // User's UID
     createdByName: string; // User's name// userId of admin or faculty
    createdAt: Date;
    type: 'announcement' | 'event'; // New field to specify type
    date?: Date | null;// Optional event date
    imageUrl?: string; // Optional image URL
    attachments?: string[]; // Optional list of attachment URLs
    links?: { label: string; url: string }[]; // Optional links or buttons
  }

  


