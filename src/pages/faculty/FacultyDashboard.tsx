// src/pages/faculty/FacultyDashboard.tsx

import React, { useEffect, useState } from "react";
import "../../styles/FacultyDashboard.css";
import { authService, CustomUser } from "../../services/authService";
import { appointmentService } from "../../services/appointmentService";
import type { Appointment } from "../../types/appointment";
import { announcementService } from "../../services/announcementService";
import type { Announcement, AnnouncementPayload } from "../../types/announcement";
import { notificationService } from "../../services/notificationService";
import type { FirestoreNotification } from "../../types/notification";
import CreateAnnouncementForm from "../../components/CreateAnnouncementForm";
import AnnouncementCard from "../../components/AnnouncementCard";
import NotificationBanner from "../../components/NotificationBanner";
import Sidebar from "../../components/Sidebar";
import LoadingSpinner from "../../components/LoadingSpinner";

const FacultyDashboard: React.FC = () => {
  const [userData, setUserData] = useState<CustomUser | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<FirestoreNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userRole = "faculty";

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          setError("No user found");
          setLoading(false);
          return;
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

        const unsubscribeNotifications = notificationService.subscribeToUserNotifications(
          user.uid,
          (newNotifications: FirestoreNotification[]) => {
            setNotifications(newNotifications);
          }
        );

        return () => {
          unsubscribeAppointments();
          unsubscribeAnnouncements();
          unsubscribeNotifications();
        };
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError("Error loading dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await announcementService.deleteAnnouncement(id);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setError('Failed to delete announcement');
    }
  };

  const handleUpdateAnnouncement = async (id: string, updateData: Partial<AnnouncementPayload>) => {
    try {
      await announcementService.updateAnnouncement(id, updateData);
    } catch (error) {
      console.error('Error updating announcement:', error);
      setError('Failed to update announcement');
    }
  };

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

  const handleDismissNotification = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error dismissing notification:', error);
      setError('Failed to dismiss notification');
    }
  };

  return (
    <div className="faculty-dashboard">
      <Sidebar userRole={userRole} />
      <div className="dashboard-content">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <div className="notifications-section">
              <h2>Notifications</h2>
              {notifications.map((notification) => (
                <NotificationBanner
                  key={notification.id}
                  notification={{
                    ...notification,
                    timestamp: notification.timestamp.toDate(),
                  }}
                  onClose={handleDismissNotification}
                />
              ))}
            </div>

            <div className="announcements-section">
              <h2>Announcements</h2>
              <CreateAnnouncementForm />
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onDelete={() => handleDeleteAnnouncement(announcement.id)}
                    onUpdate={(updateData) => handleUpdateAnnouncement(announcement.id, updateData)}
                  />
                ))
              ) : (
                <p>No announcements available</p>
              )}
            </div>

            <div className="appointments-section">
              <h2>Appointments</h2>
              {appointments.length > 0 ? (
                appointments.map((appointment) => (
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
                ))
              ) : (
                <p>No appointments available</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboard;
