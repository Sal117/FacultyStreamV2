// src/pages/student/StudentDashboard.tsx

import React, { useState, useEffect, useContext } from "react";
import AppointmentCalendar from "../../components/AppointmentCalendar";
import Sidebar from "../../components/Sidebar";
import NotificationBanner from "../../components/NotificationBanner";
import { appointmentService, Appointment } from "../../services/appointmentService";
import { notificationService } from "../../services/notificationService";
import { announcementService } from "../../services/announcementService";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/StudentDashboard.css";
import LoadingSpinner from "../../components/LoadingSpinner";
import Card from "../../components/Card";
import Button from "../../components/Button";
import AnnouncementCard from '../../components/AnnouncementCard';
import { Timestamp } from "firebase/firestore";
import type { Announcement, NotificationPayload } from '../../components/types';

interface FirestoreNotification extends Omit<NotificationPayload, 'timestamp'> {
  timestamp: Timestamp;
}

interface CalendarAppointment extends Appointment {
  faculty: string;
  room: string;
}

const StudentDashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!user) {
          throw new Error('User not authenticated');
        }

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

        const unsubscribeAnnouncements = announcementService.subscribeToAnnouncements(
          (newAnnouncements: Announcement[]) => {
            setAnnouncements(newAnnouncements.map(announcement => ({
              ...announcement,
              id: announcement.announcementId,
              createdBy: announcement.createdByUid
            })));
          }
        );

        const unsubscribeNotifications = notificationService.subscribeToUserNotifications(
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
  }, [user]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  if (loading) {
    return <LoadingSpinner />;
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
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={{
                  id: announcement.id,
                  title: announcement.title,
                  content: announcement.content,
                  createdBy: announcement.createdBy,
                  createdAt: announcement.createdAt,
                  type: announcement.type,
                  date: announcement.date,
                  imageUrl: announcement.imageUrl,
                  attachments: announcement.attachments,
                  links: announcement.links
                }}
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
