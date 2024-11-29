// src/pages/student/StudentDashboard.tsx

import React, { useState, useEffect } from "react";
import AppointmentCalendar from "../../components/AppointmentCalendar";
import Sidebar from "../../components/Sidebar";
import NotificationBanner from "../../components/NotificationBanner";
import AnnouncementCard from "../../components/AnnouncementCard";
import { useAuth } from "../../context/AuthContext";
import { notificationService } from "../../services/notificationService";
import { appointmentService } from "../../services/appointmentService";
import { announcementService } from "../../services/announcementService";
import type { Notification, FirestoreNotification } from "../../types/notification";
import type { Appointment } from "../../types/appointment";
import type { Announcement, FirestoreAnnouncement } from "../../types/announcement";
import "../../styles/StudentDashboard.css";

interface CalendarAppointment extends Appointment {
  faculty: string;
  room: string;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [processedAnnouncements, setProcessedAnnouncements] = useState<Announcement[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    // Subscribe to notifications
    const unsubscribeNotifications = notificationService.listenToNotifications(
      user.uid,
      (firestoreNotifications: FirestoreNotification[]) => {
        const convertedNotifications: Notification[] = firestoreNotifications.map(notification => ({
          ...notification,
          timestamp: notification.timestamp.toDate()
        }));
        setNotifications(convertedNotifications);
      }
    );

    // Subscribe to appointments
    const unsubscribeAppointments = appointmentService.subscribeToStudentAppointments(
      user.uid,
      (newAppointments: Appointment[]) => {
        setAppointments(newAppointments.map(appointment => ({
          ...appointment,
          faculty: appointment.facultyId,
          room: appointment.facilityId || ''
        })));
      }
    );

    // Fetch announcements
    const fetchAnnouncements = async () => {
      try {
        const result = await announcementService.getAllAnnouncements();
        const processedAnnouncements: Announcement[] = result.map(announcement => ({
          id: announcement.announcementId,
          createdAt: announcement.createdAt,
          date: announcement.date || new Date(),
          title: announcement.title,
          content: announcement.content,
          createdBy: announcement.createdByUid,
          createdByName: announcement.createdByName,
          type: announcement.type === 'announcement' ? 'general' : 'event',
          imageUrl: announcement.imageUrl,
          attachments: announcement.attachments || [],
          links: announcement.links || []
        }));
        setProcessedAnnouncements(processedAnnouncements);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };
    fetchAnnouncements();

    setLoading(false);

    return () => {
      unsubscribeNotifications();
      unsubscribeAppointments();
    };
  }, [user]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleAnnouncementDelete = async (id: string) => {
    try {
      await announcementService.deleteAnnouncement(id);
      setProcessedAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error("Error deleting announcement:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="student-dashboard">
      <Sidebar userRole="student" />
      {error && (
        <NotificationBanner
          notification={{
            id: 'error',
            type: 'error',
            message: error,
            timestamp: new Date()
          }}
          onClose={() => setError(null)}
        />
      )}

      <div className="dashboard-content">
        <section className="appointments-section">
          <h2>Your Appointments</h2>
          <AppointmentCalendar
            appointments={appointments}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            userId={user?.uid || ''}
          />
        </section>

        <section className="announcements-section">
          <h2>Announcements</h2>
          {processedAnnouncements.length > 0 ? (
            processedAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onDelete={handleAnnouncementDelete}
              />
            ))
          ) : (
            <p>No announcements available.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;
