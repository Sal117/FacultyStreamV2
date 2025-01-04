// src/pages/faculty/FacultyDashboard.tsx

import React, { useEffect, useState } from "react";
import AppointmentCalendar from "../../components/AppointmentCalendar";
import NotificationBanner from "../../components/NotificationBanner";
import AnnouncementCard from "../../components/AnnouncementCard";
import Card from "../../components/Card";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import CreateAnnouncementForm from "../../components/CreateAnnouncementForm";
import EditAnnouncementForm from "../../components/EditAnnouncementForm"; // Import the EditAnnouncementForm
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
import "../../styles/FacultyDashboard.css";
import { getFacilities } from "../../services/databaseService";
import { toast } from "react-toastify";

interface AppointmentWithStudent extends Appointment {
  student?: User | null;
}
interface Facility {
  id: string;
  name: string;
  location: string;
  status: string;
  availableSlots: string[];
  capacity?: number;
}

const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [appointments, setAppointments] = useState<AppointmentWithStudent[]>(
    []
  );
  const [facilityName, setFacilityName] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityMap, setFacilityMap] = useState<{ [key: string]: string }>({});

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [announcementToDelete, setAnnouncementToDelete] =
    useState<Announcement | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchDashboardData = async () => {
      try {
        const [
          facultyAppointments,
          facultyNotifications,
          announcementsData,
          fetchedFacilities,
        ] = await Promise.all([
          appointmentService.getAppointmentsForFaculty(user.uid),
          notificationService.getNotifications(user.uid),
          announcementService.getAllAnnouncements(),
          getFacilities(), // Fetch facilities
        ]);
        const facilityIdNameMap: { [key: string]: string } = {};
        fetchedFacilities.forEach((facility) => {
          facilityIdNameMap[facility.id] = facility.name;
        });
        setFacilities(fetchedFacilities);
        setFacilityMap(facilityIdNameMap);

        // Process appointments and fetch student data
        const appointmentsWithStudent = await Promise.all(
          facultyAppointments.map(async (appointment) => {
            try {
              const studentData = await userService.getUserById(
                appointment.studentIds[0]
              );
              return {
                ...appointment,
                date:
                  appointment.date instanceof Timestamp
                    ? appointment.date.toDate()
                    : new Date(appointment.date),
                student: studentData || null,
              } as AppointmentWithStudent;
            } catch (error) {
              console.error(
                `Error fetching student data for appointment ${appointment.id}:`,
                error
              );
              return {
                ...appointment,
                date:
                  appointment.date instanceof Timestamp
                    ? appointment.date.toDate()
                    : new Date(appointment.date),
                student: null,
              } as AppointmentWithStudent;
            }
          })
        );
        setAppointments(appointmentsWithStudent);

        // Process notifications
        const formattedNotifications = facultyNotifications.map(
          (notification) => ({
            ...notification,
            timestamp:
              notification.timestamp instanceof Timestamp
                ? notification.timestamp.toDate()
                : new Date(notification.timestamp),
            read: notification.read || false,
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
      appointmentService.subscribeToFacultyAppointments(
        user.uid,
        async (newAppointments: Appointment[]) => {
          const appointmentsWithStudent = await Promise.all(
            newAppointments.map(async (appointment) => {
              try {
                const studentData = await userService.getUserById(
                  appointment.studentIds[0]
                );
                return {
                  ...appointment,
                  date:
                    appointment.date instanceof Timestamp
                      ? appointment.date.toDate()
                      : new Date(appointment.date),
                  student: studentData || null,
                } as AppointmentWithStudent;
              } catch (error) {
                console.error(
                  `Error fetching student data for appointment ${appointment.id}:`,
                  error
                );
                return {
                  ...appointment,
                  date:
                    appointment.date instanceof Timestamp
                      ? appointment.date.toDate()
                      : new Date(appointment.date),
                  student: null,
                } as AppointmentWithStudent;
              }
            })
          );
          setAppointments(appointmentsWithStudent);
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
  }, [user, facilityMap]);

  const handleAcceptAppointment = async (appointmentId: string) => {
    try {
      await appointmentService.acceptAppointment(appointmentId);
      const appointment = appointments.find((app) => app.id === appointmentId);
      if (appointment && appointment.student) {
        await notificationService.notifyAppointmentUpdate(
          appointment.student.id,
          appointmentId,
          "Your appointment has been accepted.",
          "success"
        );
      }
    } catch (error) {
      console.error("Failed to accept appointment:", error);
      setError("Failed to accept appointment. Please try again later.");
    }
  };

  const handleRejectAppointment = async (appointmentId: string) => {
    try {
      await appointmentService.rejectAppointment(appointmentId);
      const appointment = appointments.find((app) => app.id === appointmentId);
      if (appointment && appointment.student) {
        await notificationService.notifyAppointmentUpdate(
          appointment.student.id,
          appointmentId,
          "Your appointment has been rejected.",
          "error"
        );
      }
    } catch (error) {
      console.error("Failed to reject appointment:", error);
      setError("Failed to reject appointment. Please try again later.");
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
  const confirmDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;
    try {
      await announcementService.deleteAnnouncement(
        announcementToDelete.announcementId
      );
      setAnnouncements((prev) =>
        prev.filter(
          (a) => a.announcementId !== announcementToDelete.announcementId
        )
      );
      toast.success("Announcement deleted successfully!");
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Error deleting announcement.");
    } finally {
      setIsDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
    }
  };

  const handleAnnouncementEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
  };

  const handleAnnouncementDeleteClick = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setIsDeleteDialogOpen(true);
  };

  const handleAnnouncementUpdate = (updatedAnnouncement: Announcement) => {
    setAnnouncements((prevAnnouncements) =>
      prevAnnouncements.map((ann) =>
        ann.announcementId === updatedAnnouncement.announcementId
          ? updatedAnnouncement
          : ann
      )
    );
    setEditingAnnouncement(null);
  };

  const handleEditCancel = () => {
    setEditingAnnouncement(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <main className="dashboard-main">
      <div className="dashboard-header">
        <h1>Faculty Dashboard</h1>
        {user && (
          <div className="welcome-text faculty-welcome">
            Welcome, Professor {user.name || "Faculty"}. Your students await
            your guidance.
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

        {/* Render EditAnnouncementForm when editingAnnouncement is not null */}
        {editingAnnouncement && (
          <div className="modal-overlay">
            <div className="modal-content">
              <EditAnnouncementForm
                announcement={editingAnnouncement}
                onUpdate={handleAnnouncementUpdate}
                onCancel={handleEditCancel}
              />
            </div>
          </div>
        )}

        <div className="dashboard-section">
          <h2>Notifications</h2>
          {notifications.map((notification) => (
            <NotificationBanner
              key={notification.id}
              notification={{
                ...notification,
                read: notification.read || false,
              }}
              onClose={() =>
                notificationService.clearNotification(notification.id)
              }
            />
          ))}
        </div>

        <div className="dashboard-section">
          <h2>Create Announcement</h2>
          <CreateAnnouncementForm />
        </div>

        <div className="dashboard-section">
          <h2>Announcements</h2>
          <div className="announcements-list">
            {announcements.length > 0 ? (
              announcements.map((announcement) => {
                const isCreator = announcement.createdByUid === user?.uid;
                const isAdmin = user?.role === "admin";

                return (
                  <AnnouncementCard
                    key={announcement.announcementId}
                    announcement={announcement}
                    onDelete={() => handleAnnouncementDeleteClick(announcement)}
                    onEdit={
                      isCreator || isAdmin
                        ? () => handleAnnouncementEdit(announcement)
                        : undefined
                    }
                  />
                );
              })
            ) : (
              <p>No announcements available.</p>
            )}
          </div>
        </div>

        <div className="dashboard-section appointments-section">
          <h2>Upcoming Appointments</h2>
          <div className="appointments-list">
            {appointments.length > 0 ? (
              appointments.map((appointment) => {
                // Get facility name if the meeting is physical
                const facilityName =
                  appointment.meetingType === "physical" &&
                  appointment.facilityId
                    ? facilityMap[appointment.facilityId] || "Unknown Facility"
                    : "Online Meeting";
                return (
                  <Card
                    key={appointment.id}
                    title={`Meeting with ${
                      appointment.student?.name ||
                      appointment.createdByName ||
                      "Student"
                    }`}
                    description={
                      <div className="appointment-details">
                        <div className="appointment-info">
                          <span className="info-label">Room:</span>
                          <span className="info-value">{facilityName}</span>
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
                      appointment.status === "pending" && (
                        <div className="appointment-actions">
                          <Button
                            text="Accept"
                            onClick={() =>
                              handleAcceptAppointment(appointment.id)
                            }
                            className="accept-button"
                          />
                          <Button
                            text="Reject"
                            onClick={() =>
                              handleRejectAppointment(appointment.id)
                            }
                            className="reject-button"
                          />
                        </div>
                      )
                    }
                  />
                );
              })
            ) : (
              <p>No upcoming appointments.</p>
            )}
          </div>
        </div>

        <div className="dashboard-section calendar-section">
          <h2>Calendar</h2>
          <AppointmentCalendar
            appointments={appointments.map((apt) => ({
              ...apt,
              appointmentId: apt.id,
              faculty: {
                id: user?.uid || "",
                name: user?.displayName || "",
              },
              room: apt.facilityId || "TBD",
            }))}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            userId={user?.uid || ""}
          />
        </div>
        {isDeleteDialogOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Confirm Delete</h2>
              <p>
                Are you sure you want to delete this announcement? This action
                cannot be undone.
              </p>
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={confirmDeleteAnnouncement}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default FacultyDashboard;
