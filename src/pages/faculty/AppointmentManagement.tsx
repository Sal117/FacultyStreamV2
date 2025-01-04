// src/pages/common/AppointmentManagement.tsx

import React, { useState, useEffect } from "react";
import { appointmentService } from "../../services/appointmentService";
import { userService } from "../../services/userService";
import { facilityService } from "../../services/facilityService";
import AppointmentCalendar from "../../components/AppointmentCalendar";
import AppointmentCard from "../../components/AppointmentCard";
import "../../styles/AppointmentManagement.css";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import type { Appointment } from "../../types/appointment";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AppointmentManagement: React.FC = () => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  // New state variables for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] =
    useState<Appointment | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;

      if (!isAuthenticated || !user?.uid) {
        setError("Please log in to view appointments");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fetchedAppointments =
          await appointmentService.getFacultyAppointments(user.uid);

        const [fetchedUsers, fetchedFacilities] = await Promise.all([
          userService.getAllUsers(),
          facilityService.getAllFacilities(),
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

  useEffect(() => {
    if (!selectedDate || !appointments.length) return;

    let filtered = appointments;

    filtered = filtered.filter((appointment) => {
      const appointmentDate = appointment.date;
      return (
        appointmentDate.getFullYear() === selectedDate.getFullYear() &&
        appointmentDate.getMonth() === selectedDate.getMonth() &&
        appointmentDate.getDate() === selectedDate.getDate()
      );
    });

    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (appointment) => appointment.status === filterStatus
      );
    }

    setFilteredAppointments(filtered);
  }, [selectedDate, appointments, filterStatus]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleStatusChange = (status: string) => {
    setFilterStatus(status);
  };

  const handleStatusUpdate = async (
    appointmentId: string,
    newStatus: Appointment["status"]
  ) => {
    if (!user) return;

    try {
      await appointmentService.updateAppointmentStatus(
        appointmentId,
        newStatus,
        user.uid
      );

      const updatedAppointments =
        await appointmentService.getFacultyAppointments(user.uid);
      setAppointments(updatedAppointments);

      toast.success(`Appointment ${newStatus} successfully`);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast.error("Failed to update appointment status");
    }
  };

  // Open the delete confirmation dialog
  const handleDeleteClick = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setIsDeleteDialogOpen(true);
  };

  // Confirm and delete the appointment
  const confirmDeleteAppointment = async () => {
    if (!user || !appointmentToDelete) return;

    try {
      await appointmentService.deleteAppointment(appointmentToDelete.id);

      const updatedAppointments =
        await appointmentService.getFacultyAppointments(user.uid);
      setAppointments(updatedAppointments);

      toast.success("Appointment deleted successfully");
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Failed to delete appointment");
    } finally {
      setIsDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    }
  };

  if (loading || authLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return (
      <div className="error-message">Please log in to view appointments</div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="appointment-management">
      <ToastContainer />
      <div className="header">
        <h1>Appointment Management</h1>
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
          userId={user?.uid || ""}
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
              onDelete={() => handleDeleteClick(appointment)}
            />
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirm Delete</h2>
            <p>
              Are you sure you want to delete this appointment? This action
              cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="button cancel-button"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="button delete-button"
                onClick={confirmDeleteAppointment}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManagement;
