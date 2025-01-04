// src/pages/student/StudentDashboard.tsx

import React, { useState, useEffect } from "react";
import AppointmentCalendar from "../../components/AppointmentCalendar";
import NotificationBanner from "../../components/NotificationBanner";
import AnnouncementCard from "../../components/AnnouncementCard";
import Card from "../../components/Card";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import { notificationService } from "../../services/notificationService";
import { appointmentService } from "../../services/appointmentService";
import { announcementService } from "../../services/announcementService";
import { userService } from "../../services/userService";
import type { Notification } from "../../types/notification";
import type { Appointment } from "../../types/appointment";
import type { Announcement, AnnouncementType } from "../../types/announcement";
import type { User } from "../../services/userService";
import { Timestamp } from "firebase/firestore";
import "../../styles/StudentDashboard.css";

interface AppointmentWithFaculty extends Appointment {
  faculty?: User | null;
  facilityName?: string | null;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [appointments, setAppointments] = useState<AppointmentWithFaculty[]>(
    []
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchDashboardData = async () => {
      try {
        const [studentAppointments, studentNotifications, announcementsData] =
          await Promise.all([
            appointmentService.getAppointmentsForUser(user.uid),
            notificationService.getNotifications(user.uid),
            announcementService.getAllAnnouncements(),
          ]);

        // Process appointments and fetch faculty/facility data
        const appointmentsWithDetails = await Promise.all(
          studentAppointments.map(async (appointment) => {
            try {
              const [facultyData, facilityData] = await Promise.all([
                userService.getUserById(appointment.facultyId),
                appointment.facilityId
                  ? appointmentService.getFacilityById(appointment.facilityId)
                  : Promise.resolve(null), // Fetch facility details only if facilityId exists
              ]);

              return {
                ...appointment,
                date:
                  appointment.date instanceof Timestamp
                    ? appointment.date.toDate()
                    : new Date(appointment.date),
                faculty: facultyData || null,
                facilityName: facilityData?.FacilityName || null, // Use facility name if available
              } as AppointmentWithFaculty;
            } catch (error) {
              console.error(
                `Error fetching details for appointment ${appointment.id}:`,
                error
              );
              return {
                ...appointment,
                date:
                  appointment.date instanceof Timestamp
                    ? appointment.date.toDate()
                    : new Date(appointment.date),
                faculty: null,
                facilityName: null,
              } as AppointmentWithFaculty;
            }
          })
        );

        setAppointments(appointmentsWithDetails);

        // Process notifications
        const formattedNotifications = studentNotifications.map(
          (notification) => ({
            ...notification,
            timestamp:
              notification.timestamp instanceof Timestamp
                ? notification.timestamp.toDate()
                : new Date(notification.timestamp),
            read: false,
          })
        );
        setNotifications(formattedNotifications);

        // Process announcements
        const processedAnnouncements: Announcement[] = announcementsData.map(
          (announcement) => ({
            announcementId: announcement.announcementId,
            type: announcement.type as AnnouncementType,
            date:
              announcement.date instanceof Timestamp
                ? announcement.date.toDate()
                : new Date(announcement.date || Date.now()),
            title: announcement.title,
            content: announcement.content,
            createdByUid: announcement.createdByUid,
            createdByName: announcement.createdByName,
            createdAt:
              announcement.createdAt instanceof Timestamp
                ? announcement.createdAt.toDate()
                : new Date(announcement.createdAt || Date.now()),
            imageUrl: announcement.imageUrl,
            attachments: announcement.attachments || [],
            links: (announcement.links || []).map((link) => ({
              label: link.label || "",
              url: link.url,
            })),
          })
        );
        setAnnouncements(processedAnnouncements);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up real-time subscriptions
    const unsubscribeAppointments =
      appointmentService.subscribeToStudentAppointments(
        user.uid,
        async (newAppointments: Appointment[]) => {
          const appointmentsWithFaculty = await Promise.all(
            newAppointments.map(async (appointment) => {
              try {
                const facultyData = await userService.getUserById(
                  appointment.facultyId
                );
                return {
                  ...appointment,
                  date:
                    appointment.date instanceof Timestamp
                      ? appointment.date.toDate()
                      : new Date(appointment.date),
                  faculty: facultyData || null,
                } as AppointmentWithFaculty;
              } catch (error) {
                console.error(
                  `Error fetching faculty data for appointment ${appointment.id}:`,
                  error
                );
                return {
                  ...appointment,
                  date:
                    appointment.date instanceof Timestamp
                      ? appointment.date.toDate()
                      : new Date(appointment.date),
                  faculty: null,
                } as AppointmentWithFaculty;
              }
            })
          );
          setAppointments(appointmentsWithFaculty);
        }
      );

    const unsubscribeAnnouncements =
      announcementService.subscribeToAnnouncements((data) => {
        const formattedAnnouncements: Announcement[] = data.map(
          (announcement) => ({
            announcementId: announcement.announcementId,
            type: announcement.type as AnnouncementType,
            date:
              announcement.date instanceof Timestamp
                ? announcement.date.toDate()
                : new Date(announcement.date || Date.now()),
            title: announcement.title,
            content: announcement.content,
            createdByUid: announcement.createdByUid,
            createdByName: announcement.createdByName,
            createdAt:
              announcement.createdAt instanceof Timestamp
                ? announcement.createdAt.toDate()
                : new Date(announcement.createdAt || Date.now()),
            imageUrl: announcement.imageUrl,
            attachments: announcement.attachments || [],
            links: (announcement.links || []).map((link) => ({
              label: link.label || "",
              url: link.url,
            })),
          })
        );
        setAnnouncements(formattedAnnouncements);
      });

    return () => {
      if (typeof unsubscribeAppointments === "function")
        unsubscribeAppointments();
      if (typeof unsubscribeAnnouncements === "function")
        unsubscribeAnnouncements();
    };
  }, [user]);

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await appointmentService.cancelAppointment(appointmentId);
      setAppointments(appointments.filter((app) => app.id !== appointmentId));
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      setError("Failed to cancel appointment. Please try again later.");
    }
  };

  const handleAnnouncementDelete = async (id: string) => {
    try {
      await announcementService.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.announcementId !== id));
    } catch (error) {
      console.error("Error deleting announcement:", error);
      setError("Failed to delete announcement. Please try again later.");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="student-dashboard">
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Student Dashboard</h1>
          {user && (
            <div className="welcome-text student-welcome">
              Welcome back, {user.name || "Student"}! Ready to continue your
              academic journey?
            </div>
          )}
        </div>
        <div className="dashboard-content">
          {error && (
            <NotificationBanner
              notification={{
                id: "error",
                type: "error",
                message: error,
                timestamp: new Date(),
                read: false,
              }}
              onClose={() => setError(null)}
            />
          )}

          <div className="dashboard-section">
            <h2>Notifications</h2>
            {notifications.map((notification) => (
              <NotificationBanner
                key={notification.id}
                notification={{
                  ...notification,
                  read: false,
                }}
                onClose={() =>
                  notificationService.clearNotification(notification.id)
                }
              />
            ))}
          </div>

          <div className="dashboard-section">
            <h2>Announcements</h2>
            {announcements.length > 0 ? (
              announcements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.announcementId}
                  announcement={announcement}

                  // onEdit is optional and not needed for students
                />
              ))
            ) : (
              <p>No announcements available.</p>
            )}
          </div>

          <div className="dashboard-section appointments-section">
            <h2>Upcoming Appointments</h2>
            <div className="appointments-list">
              {appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <Card
                    key={appointment.id}
                    title={`Meeting with ${
                      appointment.faculty?.name ||
                      appointment.createdByName ||
                      "Professor"
                    }`}
                    description={
                      <div className="appointment-details">
                        <div className="appointment-info">
                          <span className="info-label">Room:</span>
                          <span className="info-value">
                            {appointment.facilityName || "Online Meeting"}
                          </span>
                        </div>
                        <div className="appointment-info">
                          <span className="info-label">Date:</span>
                          <span className="info-value">
                            {appointment.date.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="appointment-info">
                          <span className="info-label">Time:</span>
                          <span className="info-value">{`${appointment.startTime} - ${appointment.endTime}`}</span>
                        </div>
                        <div className="appointment-info">
                          <span className="info-label">Type:</span>
                          <span className="info-value">
                            {appointment.meetingType}
                          </span>
                        </div>
                        <div className="appointment-info">
                          <span className="info-label">Status:</span>
                          <span
                            className={`status-badge status-${appointment.status}`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                        {appointment.meetingType === "online" &&
                          appointment.meetingLink && (
                            <div className="appointment-info">
                              <span className="info-label">Link:</span>
                              <a
                                href={appointment.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="meeting-link"
                              >
                                Join Meeting
                              </a>
                            </div>
                          )}
                      </div>
                    }
                    extra={
                      <Button
                        text="Cancel Appointment"
                        onClick={() => handleCancelAppointment(appointment.id)}
                        disabled={appointment.status !== "pending"}
                      />
                    }
                  />
                ))
              ) : (
                <p>No upcoming appointments.</p>
              )}
            </div>
          </div>

          <div className="dashboard-section calendar-section">
            <h2>Calendar</h2>
            <AppointmentCalendar
              appointments={appointments}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              userId={user?.uid || ""}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
