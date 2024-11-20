import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth"; // Import Firebase auth
import "../../styles/FacultyDashboard.css";
import { databaseService } from "../../services/databaseService"; // Import databaseService
import { notificationService } from "../../services/notificationService"; // Import notification service

import {
  getAppointments,
  getDocuments,
  getUserData,
  getFacilityBookings,
} from "../../services/databaseService";

import { Appointment, Document, User } from "../../components/types";
import NavigationBar from "../../components/NavigationBar";
import Sidebar from "../../components/Sidebar";
import Card from "../../components/Card"; // Reusing the Card component for documents
import NotificationBanner from "../../components/NotificationBanner";
// Add this to the top of FacultyDashboard.tsx

type Notification = {
  id: string;
  message: string;
  type: "info" | "alert" | "update" | "success" | "error";
  timestamp: Date;
};

const FacultyDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [userData, setUserData] = useState<User | null>(null);
  const [facilityBookings, setFacilityBookings] = useState<any[]>([]); // New state for facility bookings
  const [notifications, setNotifications] = useState<Notification[]>([]); // Update type to match Notification
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        const userId = currentUser.uid;
        const userData = await getUserData(userId);
        const appointmentsData = await getAppointments(userId);
        const documentsData = await getDocuments();
        const facilityBookingsData = await getFacilityBookings(userId); // Fetching facility bookings

        if (userData) setUserData(userData);
        setAppointments(appointmentsData);
        setDocuments(documentsData);
        setFacilityBookings(facilityBookingsData);

        // Subscribe to notifications for the faculty member
        const unsubscribe = notificationService.subscribe(
          (newNotifications: any[]) => {
            // Convert Timestamp to Date
            const formattedNotifications: Notification[] = newNotifications.map(
              (notif) => ({
                ...notif,
                timestamp: notif.timestamp.toDate(), // Convert to Date
              })
            );
            setNotifications(formattedNotifications);
          }
        );

        return () => unsubscribe(); // Unsubscribe when the component unmounts
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="faculty-dashboard">
      <Sidebar userRole={"faculty"} />
      <main className="dashboard-main">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="dashboard-header">
              <h1>Welcome, {userData?.name}!</h1>
              {/* Display notifications banner */}
              {notifications.length > 0 &&
                notifications.map((notif) => (
                  <NotificationBanner
                    key={notif.id}
                    type={notif.type}
                    message={notif.message}
                    timestamp={notif.timestamp}
                    onClose={() =>
                      notificationService.clearNotification(notif.id)
                    }
                  />
                ))}
            </div>

            <section className="dashboard-section">
              <h2>Your Appointments</h2>
              <div className="appointments-container">
                {appointments.map((appointment) => (
                  <Card
                    key={appointment.appointmentId}
                    title={`Meeting with student`}
                    description={`${appointment.date} at ${appointment.room}`}
                    status={appointment.status}
                  />
                ))}
              </div>
            </section>

            <section className="dashboard-section">
              <h2>Your Documents</h2>
              <div className="documents-container">
                {documents.map((document) => (
                  <Card
                    key={document.documentId}
                    title={document.title}
                    description={document.description}
                    link={document.fileUrl}
                    extra={`Created by: ${document.createdBy} on ${new Date(
                      document.createdAt
                    ).toLocaleDateString()}`}
                  />
                ))}
              </div>
            </section>

            <section className="dashboard-section">
              <h2>Facility Bookings</h2>
              <div className="facility-bookings-container">
                {facilityBookings.length > 0 ? (
                  facilityBookings.map((booking) => (
                    <Card
                      key={booking.bookingId}
                      title={`Booking for ${booking.facilityName}`}
                      description={`Date: ${new Date(
                        booking.date
                      ).toLocaleDateString()} - Slot: ${booking.slot}`}
                      status={booking.status}
                    />
                  ))
                ) : (
                  <p>No upcoming facility bookings.</p>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default FacultyDashboard;
