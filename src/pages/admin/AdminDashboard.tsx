import React, { useEffect, useState } from "react";
import "../../styles/Dashboard.css";
import {
  getAppointments,
  getUserData,
  addEvent,
  getAllStudents,
  getAllFaculties,
  getAllFacilities,
} from "../../services/databaseService";
import { Appointment, User } from "../../components/types";
import NavigationBar from "../../components/NavigationBar";
import Sidebar from "../../components/Sidebar";
import Card from "../../components/Card";
import AddEventModal from "../../components/AddEventModal";
import UserManagement from "../../components/UserManagement";
import FacilityBooking from "../../components/FacilityBooking";
import AddUserForm from "../../components/AddUserForm";
import NotificationBanner from "../../components/NotificationBanner";
import { notificationService } from "../../services/notificationService";
import { Timestamp } from "firebase/firestore";

const AdminDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [userData, setUserData] = useState<User | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<any[]>([]); // Notifications state
  const userRole = "admin"; // Setting the role explicitly for Sidebar

  useEffect(() => {
    async function fetchData() {
      try {
        const userId = localStorage.getItem("userId"); // Retrieve user ID from local storage or session
        if (!userId) throw new Error("User not authenticated");

        const user = await getUserData(userId);
        if (user) {
          setUserData(user);

          const appointmentsData = await getAppointments(user.userId);
          const studentsData = await getAllStudents();
          const facultiesData = await getAllFaculties();
          const facilitiesData = await getAllFacilities();

          setAppointments(appointmentsData);
          setStudents(studentsData);
          setFaculties(facultiesData);
          setFacilities(facilitiesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Subscribe to notifications
    const unsubscribe = notificationService.subscribe(
      (newNotifications: any[]) => {
        setNotifications(
          newNotifications.map((n) => {
            let timestamp;
            if (n.timestamp instanceof Timestamp) {
              timestamp = n.timestamp.toDate(); // Convert Firestore Timestamp to Date
            } else if (typeof n.timestamp === "string") {
              timestamp = new Date(n.timestamp);
            } else {
              timestamp = new Date(); // Default to current date if invalid
            }
            return { ...n, timestamp };
          })
        );
      }
    );

    return () => unsubscribe(); // Cleanup on component unmount
  }, []);

  const handleAddEvent = async (eventData: {
    title: string;
    description: string;
    date: string;
  }) => {
    try {
      await addEvent(eventData);
      notificationService.notify({
        message: `Event "${eventData.title}" added successfully!`,
        type: "success",
        timestamp: Timestamp.now(),
      });
      console.log("Event added successfully:", eventData);
    } catch (error) {
      notificationService.notify({
        message: "Error adding event.",
        type: "error",
        timestamp: Timestamp.now(),
      });
      console.error("Error adding event:", error);
    }
  };

  const formatAppointmentDate = (date: any): string => {
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleDateString();
    } else if (typeof date === "string") {
      return new Date(date).toLocaleDateString();
    } else if (date instanceof Date) {
      return date.toLocaleDateString();
    } else {
      return "Invalid date"; // Fallback for unexpected cases
    }
  };

  return (
    <div className="dashboard">
      <main className="dashboard-main">
        {loading ? (
          <p className="loading">Loading...</p>
        ) : (
          <>
            {/* Notifications Banner */}
            {notifications.map((notification) => (
              <NotificationBanner
                key={notification.id}
                type={notification.type}
                message={notification.message}
                timestamp={notification.timestamp.toLocaleString()} // Format Date for display
                onClose={() =>
                  notificationService.clearNotification(notification.id)
                }
              />
            ))}

            <div className="dashboard-header">
              <h1>Welcome, {userData?.name}!</h1>
              <p className="dashboard-subtitle">Admin Dashboard Overview</p>
              <div className="quick-actions">
                <button
                  className="action-button"
                  onClick={() => setIsModalOpen(true)}
                >
                  Add Event
                </button>
                <button className="action-button">View Reports</button>
                <button className="action-button">Manage Users</button>
              </div>
            </div>

            <section className="stats-overview">
              <div className="stat-card">Total Students: {students.length}</div>
              <div className="stat-card">
                Total Faculties: {faculties.length}
              </div>
              <div className="stat-card">
                Available Facilities: {facilities.length}
              </div>
            </section>

            <section className="dashboard-section">
              <h2>Upcoming Appointments</h2>
              {appointments.length > 0 ? (
                <div className="appointments-container">
                  {appointments.map((appointment) => (
                    <Card
                      key={appointment.appointmentId}
                      title={appointment.faculty}
                      description={`Room: ${
                        appointment.room
                      } - ${formatAppointmentDate(appointment.date)}`}
                      status={appointment.status}
                    />
                  ))}
                </div>
              ) : (
                <p className="no-appointments">No upcoming appointments.</p>
              )}
            </section>

            <section className="dashboard-section">
              <h2>Facilities Management</h2>
              <FacilityBooking facilities={facilities} />
            </section>

            <section className="dashboard-section">
              <h2>User Management</h2>
              <AddUserForm />
              <UserManagement students={students} faculties={faculties} />
            </section>

            <AddEventModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onAddEvent={handleAddEvent}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
