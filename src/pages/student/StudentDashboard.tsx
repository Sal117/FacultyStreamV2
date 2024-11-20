import React, { useState, useEffect, useContext } from "react";
import AppointmentCalendar from "../../components/AppointmentCalendar";
import Sidebar from "../../components/Sidebar";
import NotificationBanner from "../../components/NotificationBanner";
import { appointmentService } from "../../services/appointmentService";
import { notificationService } from "../../services/notificationService";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/StudentDashboard.css";
import LoadingSpinner from "../../components/LoadingSpinner";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { Timestamp } from "firebase/firestore"; // Import Timestamp for conversion

interface Appointment {
  appointmentId: string;
  date: Date;

  status: string;
  room: string;
}

interface Notification {
  id: string;
  message: string;
  timestamp: Date;
  type: "info" | "alert" | "update" | "success" | "error";
}

const StudentDashboard: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        if (user) {
          const [studentAppointments, studentNotifications] = await Promise.all(
            [
              appointmentService.getAppointmentsForUser(user.uid),
              notificationService.getNotifications(user.uid),
            ]
          );

          // Convert notification timestamps to Date objects
          const formattedNotifications = studentNotifications.map((notif) => ({
            ...notif,
            timestamp: (notif.timestamp as Timestamp).toDate(), // Convert to Date
          }));

          setAppointments(studentAppointments);
          setNotifications(formattedNotifications);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await appointmentService.cancelAppointment(appointmentId);
      setAppointments(
        appointments.filter((app) => app.appointmentId !== appointmentId)
      );
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
    }
  };

  return (
    <div className="student-dashboard">
      <div className="dashboard-content">
        <h1>Welcome, {user?.name}</h1>

        {/* Appointments Section */}
        <div className="dashboard-section">
          <h2>Upcoming Appointments</h2>
          {loading ? (
            <LoadingSpinner />
          ) : appointments.length > 0 ? (
            <div className="appointments-list">
              {appointments.map((appointment) => (
                <Card
                  key={appointment.appointmentId}
                  title={`Appointment with ${appointment}`}
                  description={`Room: ${
                    appointment.room
                  } | Date: ${appointment.date.toLocaleDateString()} | Status: ${
                    appointment.status
                  }`}
                  extra={
                    <Button
                      text="Cancel Appointment"
                      onClick={() =>
                        handleCancelAppointment(appointment.appointmentId)
                      }
                      disabled={appointment.status !== "pending"}
                    />
                  }
                />
              ))}
            </div>
          ) : (
            <p>No upcoming appointments.</p>
          )}
        </div>

        {/* Notifications Section */}
        <div className="dashboard-section">
          <h2>Notifications</h2>
          {notifications.map((notification) => (
            <NotificationBanner
              key={notification.id}
              type={notification.type}
              message={notification.message}
              timestamp={notification.timestamp}
            />
          ))}
        </div>

        {/* Calendar Section */}
        <div className="dashboard-section">
          <h2>Calendar</h2>
          <AppointmentCalendar
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            userId={""}
          />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
