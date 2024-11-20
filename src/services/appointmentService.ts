import { db } from "./firebase";
import { Appointment } from "../components/types"; // Import the shared Appointment type

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

class AppointmentService {
  // Add a new appointment
  async addAppointment(appointmentData: Omit<Appointment, "appointmentId">): Promise<Appointment> {
    try {
      const docRef = await addDoc(collection(db, "appointments"), {
        ...appointmentData,
        date: Timestamp.fromDate(appointmentData.date),
        reason: appointmentData.reason || "No reason provided",
        meetingLink: appointmentData.meetingLink || "",
      });
      console.log(`Appointment added with ID: ${docRef.id}`);
      return {
        appointmentId: docRef.id,
        ...appointmentData,
      };
    } catch (error) {
      console.error("Failed to add appointment:", error);
      throw new Error("Failed to add appointment");
    }
  }

  // Fetch appointments for a user with optional date range
  async getAppointmentsForUser(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Appointment[]> {
    let q = query(collection(db, "appointments"), where("userId", "==", userId));

    if (startDate) {
      q = query(q, where("date", ">=", Timestamp.fromDate(startDate)));
    }
    if (endDate) {
      q = query(q, where("date", "<=", Timestamp.fromDate(endDate)));
    }

    try {
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        appointmentId: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
      })) as Appointment[];
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      throw new Error("Failed to fetch appointments");
    }
  }


  
 

  // Fetch appointments for a specific faculty or all faculty members
  async getAppointmentsForFaculty(facultyId?: string): Promise<Appointment[]> {
    let q = facultyId
      ? query(collection(db, "appointments"), where("faculty", "==", facultyId))
      : collection(db, "appointments"); // Fetch all appointments if no facultyId is provided

    try {
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        appointmentId: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
        reason: doc.data().reason || "No reason provided", // Ensure reason is included
        meetingLink: doc.data().meetingLink || "", // Optional field
      })) as Appointment[];
    } catch (error) {
      console.error("Failed to fetch appointments for faculty:", error);
      throw new Error("Failed to fetch appointments for faculty");
    }
  }

  // Fetch all appointments
  async getAllAppointments(): Promise<Appointment[]> {
    try {
      const snapshot = await getDocs(collection(db, "appointments"));
      return snapshot.docs.map((doc) => ({
        appointmentId: doc.id,
        ...doc.data(),
        date: (doc.data().date as Timestamp).toDate(),
      })) as Appointment[];
    } catch (error) {
      console.error("Failed to fetch all appointments:", error);
      throw new Error("Failed to fetch all appointments");
    }
  }

  // Update an appointment
  async updateAppointment(
    appointmentId: string,
    updateData: Partial<Appointment>
  ): Promise<void> {
    try {
      const appointmentRef = doc(db, "appointments", appointmentId);
      const dataToUpdate = {
        ...updateData,
        ...(updateData.date && { date: Timestamp.fromDate(updateData.date) }),
      };
      await updateDoc(appointmentRef, dataToUpdate);
      console.log(`Appointment updated: ${appointmentId}`);
    } catch (error) {
      console.error("Failed to update appointment:", error);
      throw new Error("Failed to update appointment");
    }
  }


  // Cancel an appointment
  async cancelAppointment(appointmentId: string): Promise<void> {
    try {
      await this.updateAppointment(appointmentId, { status: "cancelled" });
      console.log(`Appointment cancelled: ${appointmentId}`);
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      throw new Error("Failed to cancel appointment");
    }
  }

  // Fetch all users (faculty and students)
  async getAllUsers(): Promise<{ id: string; name: string; role: string }[]> {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      return usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        if (!data.role) {
          console.warn(`User ${doc.id} has no role defined.`);
        }
        return {
          id: doc.id,
          name: data.name || "Unknown",
          role: data.role || "Unknown",
        };
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Error fetching users");
    }
  }

  // Accept an appointment
  async acceptAppointment(appointmentId: string): Promise<void> {
    try {
      await this.updateAppointment(appointmentId, { status: "confirmed" });
      console.log(`Appointment accepted: ${appointmentId}`);
    } catch (error) {
      console.error("Failed to accept appointment:", error);
      throw new Error("Failed to accept appointment");
    }
  }

  // Reject an appointment
  async rejectAppointment(appointmentId: string): Promise<void> {
    try {
      await this.updateAppointment(appointmentId, { status: "rejected" });
      console.log(`Appointment rejected: ${appointmentId}`);
    } catch (error) {
      console.error("Failed to reject appointment:", error);
      throw new Error("Failed to reject appointment");
    }
  }
  // Add appointment with secondary user
  async addAppointmentWithSecondaryUser(
    appointmentData: Omit<Appointment, "appointmentId"> & { secondaryUserId: string }
  ): Promise<Appointment> {
    try {
      const docRef = await addDoc(collection(db, "appointments"), {
        ...appointmentData,
        date: Timestamp.fromDate(appointmentData.date),
      });
      console.log(`Appointment added with ID: ${docRef.id}`);
      return {
        appointmentId: docRef.id,
        ...appointmentData,
      };
    } catch (error) {
      console.error("Failed to add appointment with secondary user:", error);
      throw new Error("Failed to add appointment with secondary user");
    }
  }

// Fetch appointments with secondary user involvement
async getAppointmentsWithSecondaryUser(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Appointment[]> {
  try {
    let primaryQuery = query(
      collection(db, "appointments"),
      where("userId", "==", userId)
    );
    let secondaryQuery = query(
      collection(db, "appointments"),
      where("secondaryUserId", "==", userId)
    );

    if (startDate) {
      const startTimestamp = Timestamp.fromDate(startDate);
      primaryQuery = query(primaryQuery, where("date", ">=", startTimestamp));
      secondaryQuery = query(secondaryQuery, where("date", ">=", startTimestamp));
    }

    if (endDate) {
      const endTimestamp = Timestamp.fromDate(endDate);
      primaryQuery = query(primaryQuery, where("date", "<=", endTimestamp));
      secondaryQuery = query(secondaryQuery, where("date", "<=", endTimestamp));
    }

    const [primarySnapshot, secondarySnapshot] = await Promise.all([
      getDocs(primaryQuery),
      getDocs(secondaryQuery),
    ]);

    const primaryAppointments = primarySnapshot.docs.map((doc) => ({
      appointmentId: doc.id,
      ...doc.data(),
      date: (doc.data().date as Timestamp).toDate(),
    })) as Appointment[];

    const secondaryAppointments = secondarySnapshot.docs.map((doc) => ({
      appointmentId: doc.id,
      ...doc.data(),
      date: (doc.data().date as Timestamp).toDate(),
    })) as Appointment[];

    return [...primaryAppointments, ...secondaryAppointments];
  } catch (error) {
    console.error("Failed to fetch appointments with secondary user:", error);
    throw new Error("Failed to fetch appointments with secondary user");
  }
}
}




export const appointmentService = new AppointmentService();
