import { db } from "./firebase";
import { getDoc, doc, Timestamp } from "firebase/firestore";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

// Validate email configuration
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("Email configuration is missing in environment variables.");
  throw new Error("Email configuration is missing. Check .env file.");
}

// Initialize Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // You can replace this with other email service providers
  auth: {
    user: process.env.EMAIL_USER, // Email address from environment variables
    pass: process.env.EMAIL_PASS, // Password from environment variables
  },
});

// Generalized function to send an email
const sendEmail = async (
  to: string,
  subject: string,
  text: string
): Promise<void> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender email
      to, // Recipient email
      subject,
      text,
    };

    // Send email using Nodemailer
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to} with subject: "${subject}"`);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error sending email:", error.message);
      throw new Error("Failed to send email.");
    } else {
      console.error("Unknown error occurred while sending email.");
      throw new Error("Failed to send email due to an unknown error.");
    }
  }
};

// Function to send appointment creation notification
export const sendAppointmentNotification = async (
  userId: string,
  date: Timestamp,
  reason: string,
  meetingLink?: string
): Promise<void> => {
  try {
    // Fetch user details
    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      throw new Error(`User data not found for userId: ${userId}`);
    }

    const userData = userSnapshot.data();
    const userEmail = userData?.email;
    const userName = userData?.name;

    if (!userEmail) {
      throw new Error(`Email not found for userId: ${userId}`);
    }

    // Format booking date
    const appointmentDate = date.toDate();
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Construct email content
    const subject = "Appointment Confirmation";
    const text = `Dear ${userName},\n\nYour appointment has been scheduled successfully for ${formattedDate}. Reason: ${reason}.\n\n${
      meetingLink ? `Google Meet link: ${meetingLink}\n\n` : ""
    }Thank you for using our system.\n\nBest regards,\nFacultyStream Team`;

    // Send email
    await sendEmail(userEmail, subject, text);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error sending appointment notification:", error.message);
      throw new Error("Failed to send appointment notification.");
    } else {
      console.error("Unknown error occurred while sending appointment notification.");
      throw new Error("Failed to send appointment notification due to an unknown error.");
    }
  }
};

// Function to send appointment cancellation notification
export const sendAppointmentCancellationNotification = async (
  userId: string,
  date: Timestamp,
  reason: string
): Promise<void> => {
  try {
    // Fetch user details
    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      throw new Error(`User data not found for userId: ${userId}`);
    }

    const userData = userSnapshot.data();
    const userEmail = userData?.email;
    const userName = userData?.name;

    if (!userEmail) {
      throw new Error(`Email not found for userId: ${userId}`);
    }

    // Format cancellation date
    const appointmentDate = date.toDate();
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Construct email content
    const subject = "Appointment Cancellation";
    const text = `Dear ${userName},\n\nYour appointment scheduled for ${formattedDate} has been canceled. Reason: ${reason}.\n\nIf you have any questions, please contact support.\n\nBest regards,\nFacultyStream Team`;

    // Send email
    await sendEmail(userEmail, subject, text);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error sending appointment cancellation notification:", error.message);
      throw new Error("Failed to send appointment cancellation notification.");
    } else {
      console.error("Unknown error occurred while sending appointment cancellation notification.");
      throw new Error("Failed to send appointment cancellation notification due to an unknown error.");
    }
  }
};
