// src/pages/faculty/FacultyDashboard.tsx

import React, { useEffect, useState } from "react";
import "../../styles/FacultyDashboard.css";
import { authService, CustomUser } from "../../services/authService";
import { appointmentService, Appointment } from "../../services/appointmentService";
import { announcementService } from "../../services/announcementService";
import { notificationService } from "../../services/notificationService";
import type { Announcement, NotificationPayload } from "../../components/types";
import CreateAnnouncementForm from "../../components/CreateAnnouncementForm";
import AnnouncementCard from "../../components/AnnouncementCard";
import NotificationBanner from "../../components/NotificationBanner";
import Sidebar from "../../components/Sidebar";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Timestamp } from "firebase/firestore";

interface FirestoreNotification extends Omit<NotificationPayload, 'timestamp'> {
  timestamp: Timestamp;
}

const FacultyDashboard: React.FC = () => {
  const [userData, setUserData] = useState<CustomUser | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userRole = "faculty";

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          throw new Error('User not authenticated');
        }
        setUserData(user);

        const unsubscribeAppointments = appointmentService.subscribeToFacultyAppointments(
          user.uid,
          (newAppointments: Appointment[]) => {
            setAppointments(newAppointments);
          }
        );

        const unsubscribeAnnouncements = announcementService.subscribeToAnnouncements(
          (newAnnouncements: Announcement[]) => {
            setAnnouncements(newAnnouncements);
          }
        );

        const unsubscribeNotifications = notificationService.listenToNotifications(
          user.uid,
          (newNotifications: FirestoreNotification[]) => {
            setNotifications(newNotifications.map(notification => ({
              ...notification,
              timestamp: notification.timestamp.toDate()
            })));
          }
        );

        setLoading(false);

        return () => {
          unsubscribeAppointments();
          unsubscribeAnnouncements();
          unsubscribeNotifications();
        };
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAcceptAppointment = async (appointmentId: string) => {
    try {
      await appointmentService.acceptAppointment(appointmentId);
    } catch (error) {
      console.error('Error accepting appointment:', error);
      setError('Failed to accept appointment');
    }
  };

  const handleRejectAppointment = async (appointmentId: string) => {
    try {
      await appointmentService.rejectAppointment(appointmentId);
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      setError('Failed to reject appointment');
    }
  };

  return (
    <div className="faculty-dashboard">
      <Sidebar userRole={userRole} />
      {error && <NotificationBanner notification={{ 
        id: 'error',
        type: 'error',
        message: error,
        timestamp: new Date()
      }} onClose={() => setError(null)} />}
      
      <div className="dashboard-content">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <section className="dashboard-section">
              <h2>Appointments</h2>
              {appointments.length > 0 ? (
                <div className="appointments-list">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="appointment-card">
                      <h3>Appointment with {appointment.createdByName}</h3>
                      <p>Date: {appointment.date.toLocaleDateString()}</p>
                      <p>Time: {appointment.startTime} - {appointment.endTime}</p>
                      <p>Status: {appointment.status}</p>
                      {appointment.status === 'pending' && (
                        <div className="appointment-actions">
                          <button onClick={() => handleAcceptAppointment(appointment.id)}>
                            Accept
                          </button>
                          <button onClick={() => handleRejectAppointment(appointment.id)}>
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No appointments scheduled.</p>
              )}
            </section>

            <section className="dashboard-section">
              <h2>Announcements</h2>
              <CreateAnnouncementForm />
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.announcementId}
                    announcement={announcement}
                    onDelete={async (id: string) => {
                      try {
                        await announcementService.deleteAnnouncement(id);
                      } catch (error) {
                        console.error('Error deleting announcement:', error);
                      }
                    }}
                  />
                ))
              ) : (
                <p>No announcements.</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboard;
