import React, { useState, useEffect } from "react";
import { appointmentService, Appointment } from "../../services/appointmentService";
import { userService } from "../../services/userService";
import { facilityService } from "../../services/facilityService";
import AppointmentCalendar from "../../components/AppointmentCalendar";
import "../../styles/AppointmentManagement.css";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useAuth } from "../../contexts/AuthContext";

const AppointmentManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [notification, setNotification] = useState<string>("");

  // Fetch appointments and related data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid) return;

      setLoading(true);
      try {
        const [fetchedAppointments, fetchedUsers, fetchedFacilities] = await Promise.all([
          appointmentService.getAppointmentsWithSecondaryUser(currentUser.uid),
          userService.getAllUsers(),
          facilityService.getAllFacilities()
        ]);

        setAppointments(fetchedAppointments);
        setFilteredAppointments(fetchedAppointments);
        setUsers(fetchedUsers);
        setFacilities(fetchedFacilities);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Filter appointments by status and date
  useEffect(() => {
    if (!selectedDate) return;

    const filtered = appointments.filter(app => {
      const sameDate = app.date.toDateString() === selectedDate.toDateString();
      return filterStatus === "all" ? sameDate : sameDate && app.status === filterStatus;
    });

    setFilteredAppointments(filtered);
  }, [filterStatus, selectedDate, appointments]);

  const handleAppointmentStatusChange = async (
    appointmentId: string,
    newStatus: Appointment['status']
  ) => {
    try {
      if (!currentUser?.uid) {
        throw new Error('No authenticated user found');
      }

      setLoading(true);
      await appointmentService.updateAppointmentStatus(
        appointmentId,
        newStatus,
        currentUser.uid
      );
      
      const updatedAppointments = appointments.map((appointment) =>
        appointment.id === appointmentId
          ? { ...appointment, status: newStatus }
          : appointment
      );
      
      setAppointments(updatedAppointments);
      setFilteredAppointments(updatedAppointments);
      setNotification(`Appointment ${newStatus} successfully!`);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      setNotification("Failed to update appointment status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="appointment-management">
      <h2>Manage Appointments</h2>
      
      <div className="filters-section">
        <AppointmentCalendar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          userId={currentUser?.uid ?? ""}
        />

        <div className="status-filter">
          <label>Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="appointments-list">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-details">
                  <h3>Appointment with {
                    users.find(u => u.id === (
                      currentUser?.uid === appointment.primaryUserId 
                        ? appointment.secondaryUserId 
                        : appointment.primaryUserId
                    ))?.name || "Unknown"
                  }</h3>
                  
                  <p><strong>Date:</strong> {appointment.date.toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {appointment.startTime} - {appointment.endTime}</p>
                  
                  {appointment.meetingType === 'physical' && (
                    <p>
                      <strong>Facility:</strong>{" "}
                      {facilities.find(f => f.id === appointment.facilityId)?.name || "Unknown"}
                    </p>
                  )}
                  
                  {appointment.meetingType === 'online' && appointment.meetingLink && (
                    <p>
                      <strong>Meeting Link:</strong>{" "}
                      <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer">
                        Join Meeting
                      </a>
                    </p>
                  )}
                  
                  <p><strong>Status:</strong> <span className={`status ${appointment.status}`}>{appointment.status}</span></p>
                </div>

                {appointment.status === "pending" && (
                  <div className="appointment-actions">
                    <button
                      onClick={() => handleAppointmentStatusChange(appointment.id, "accepted")}
                      className="accept-btn"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleAppointmentStatusChange(appointment.id, "rejected")}
                      className="reject-btn"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No appointments found for the selected date and status.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentManagement;
