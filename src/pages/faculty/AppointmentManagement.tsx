import React, { useState, useEffect } from "react";
import { appointmentService } from "../../services/appointmentService";
import AppointmentCalendar from "../../components/AppointmentCalendar";
import "../../styles/AppointmentManagement.css";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Timestamp } from "firebase/firestore";

interface Appointment {
  appointmentId: string;
  userId: string;
  date: Date; // Using Date type for easy manipulation

  room: string;
  status: "pending" | "confirmed" | "cancelled" | "rejected";
}

const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Fetch appointments on component load or date change
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        // Fetch appointments for the faculty
        const fetchedAppointments =
          await appointmentService.getAppointmentsForUser(
            "facultyId", // Replace with actual faculty ID
            selectedDate!
          );

        // Convert the fetched data to match FacultyAppointment structure
        const mappedAppointments: Appointment[] = fetchedAppointments.map(
          (app) => ({
            appointmentId: app.appointmentId,
            userId: app.userId ?? "Unknown User",
            date: app.date ?? new Date(),

            room: app.room ?? "Unknown Room",
            status: app.status ?? "pending",
          })
        );

        setAppointments(mappedAppointments);
        setFilteredAppointments(mappedAppointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [selectedDate]);

  // Filter appointments by status
  const handleStatusFilterChange = (status: string) => {
    setFilterStatus(status);
    if (status === "all") {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(
        appointments.filter((app) => app.status === status)
      );
    }
  };

  // Update appointment status
  const handleStatusChange = async (
    appointmentId: string,
    newStatus: "confirmed" | "cancelled"
  ) => {
    try {
      await appointmentService.updateAppointment(appointmentId, {
        status: newStatus,
      });
      setAppointments((prevAppointments) =>
        prevAppointments.map((app) =>
          app.appointmentId === appointmentId
            ? { ...app, status: newStatus }
            : app
        )
      );
      setFilteredAppointments((prevFilteredAppointments) =>
        prevFilteredAppointments.map((app) =>
          app.appointmentId === appointmentId
            ? { ...app, status: newStatus }
            : app
        )
      );
    } catch (error) {
      console.error("Failed to update appointment status:", error);
    }
  };

  return (
    <div className="appointment-management">
      <h2>Manage Appointments</h2>
      <AppointmentCalendar
        selectedDate={selectedDate}
        onDateChange={(date) => setSelectedDate(date)}
        userId={""}
      />
      <div className="filters">
        <label>Status Filter:</label>
        <select
          value={filterStatus}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="appointments-list">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <div key={appointment.appointmentId} className="appointment-card">
                <p>
                  <strong>Date:</strong> {appointment.date.toLocaleDateString()}
                </p>
                <p>
                  <strong>Room:</strong> {appointment.room}
                </p>

                <p>
                  <strong>Status:</strong> {appointment.status}
                </p>
                <div className="actions">
                  {appointment.status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          handleStatusChange(
                            appointment.appointmentId,
                            "confirmed"
                          )
                        }
                        className="confirm-btn"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() =>
                          handleStatusChange(
                            appointment.appointmentId,
                            "cancelled"
                          )
                        }
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>No appointments available for the selected date and status.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentManagement;
