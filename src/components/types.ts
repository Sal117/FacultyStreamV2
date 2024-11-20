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
    appointmentId: string;
    userId: string; // ID of the user booking the appointment
    faculty: string; // ID of the faculty member involved
    room: string; // Room name or ID
    date: Date; // Appointment date and time in ISO format
    reason?: string; // Reason for the appointment
    status: "pending" | "confirmed" | "cancelled" | "rejected"; // Appointment status
    meetingLink?: string; // Optional Google Meet or online meeting link
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
  