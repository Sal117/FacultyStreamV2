import React, { useState, useEffect } from "react";
import { appointmentService } from "../../services/appointmentService";
import { userService } from "../../services/userService";
import { facilityService } from "../../services/facilityService";
import AppointmentCalendar from "../../components/AppointmentCalendar";
import AppointmentCard from "../../components/AppointmentCard"; // Import AppointmentCard component
import "../../styles/AppointmentManagement.css";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import type { Appointment } from "../../types/appointment";

const AppointmentManagement: React.FC = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [notification, setNotification] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Fetch appointments and related data
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return; // Wait for auth to initialize
      
      if (!isAuthenticated || !user?.uid) {
        console.log("No authenticated user:", { isAuthenticated, userId: user?.uid });
        setError("Please log in to view appointments");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log("Fetching appointments for faculty:", user.uid);
        const fetchedAppointments = await appointmentService.getFacultyAppointments(user.uid);
        console.log("Fetched appointments:", fetchedAppointments);

        const [fetchedUsers, fetchedFacilities] = await Promise.all([
          userService.getAllUsers(),
          facilityService.getAllFacilities()
        ]);

        setAppointments(fetchedAppointments);
        setFilteredAppointments(fetchedAppointments);
        setUsers(fetchedUsers);
        setFacilities(fetchedFacilities);
        setError(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, isAuthenticated]);

  // Filter appointments by status and date
  useEffect(() => {
    if (!selectedDate || !appointments.length) return;

    let filtered = appointments;

    // Filter by date
    filtered = filtered.filter(appointment => {
      const appointmentDate = appointment.date;
      return (
        appointmentDate.getFullYear() === selectedDate.getFullYear() &&
        appointmentDate.getMonth() === selectedDate.getMonth() &&
        appointmentDate.getDate() === selectedDate.getDate()
      );
    });

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(appointment => appointment.status === filterStatus);
    }

    setFilteredAppointments(filtered);
  }, [selectedDate, appointments, filterStatus]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleStatusChange = (status: string) => {
    setFilterStatus(status);
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: Appointment['status']) => {
    if (!user) return;

    try {
      await appointmentService.updateAppointmentStatus(appointmentId, newStatus, user.uid);
      
      // Refresh appointments
      const updatedAppointments = await appointmentService.getFacultyAppointments(user.uid);
      setAppointments(updatedAppointments);
      
      setNotification(`Appointment ${newStatus} successfully`);
      setTimeout(() => setNotification(""), 3000);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      setNotification("Failed to update appointment status");
      setTimeout(() => setNotification(""), 3000);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!user) return;

    if (!window.confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
      return;
    }

    try {
      await appointmentService.deleteAppointment(appointmentId);
      
      // Refresh appointments
      const updatedAppointments = await appointmentService.getFacultyAppointments(user.uid);
      setAppointments(updatedAppointments);
      
      setNotification('Appointment deleted successfully');
      setTimeout(() => setNotification(""), 3000);
    } catch (error) {
      console.error("Error deleting appointment:", error);
      setNotification("Failed to delete appointment");
      setTimeout(() => setNotification(""), 3000);
    }
  };

  if (loading || authLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <div className="error-message">Please log in to view appointments</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="appointment-management">
      <div className="header">
        <h1>Appointment Management</h1>
        {notification && (
          <div className="notification">{notification}</div>
        )}
      </div>

      <div className="filters">
        <select
          value={filterStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="status-filter"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="calendar-section">
        <AppointmentCalendar
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          appointments={appointments}
          userId={user?.uid || ''}
        />
      </div>

      <div className="appointments-list">
        <h2>Appointments for {selectedDate?.toLocaleDateString()}</h2>
        {filteredAppointments.length === 0 ? (
          <p>No appointments found for this date.</p>
        ) : (
          filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              currentUserRole="faculty"
              onStatusChange={handleStatusUpdate}
              onDelete={handleDeleteAppointment}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AppointmentManagement;
