import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./AppointmentCalendar.css";
import { appointmentService } from "../services/appointmentService";

interface Appointment {
  appointmentId: string;
  date: Date;
  faculty: string;
  status: string;
  room: string;
}

interface AppointmentCalendarProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  userId: string; // Dynamic userId to fetch appointments
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  selectedDate,
  onDateChange,
  userId,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsForSelectedDate, setAppointmentsForSelectedDate] =
    useState<Appointment[]>([]);
  const [highlightedDates, setHighlightedDates] = useState<{
    [key: string]: boolean;
  }>({});

  // Fetch all appointments for the user on component mount
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const allAppointments = await appointmentService.getAppointmentsForUser(
          userId
        );
        setAppointments(allAppointments);

        // Highlight dates with appointments
        const datesWithAppointments: { [key: string]: boolean } = {};
        allAppointments.forEach((appointment) => {
          const dateKey = appointment.date.toISOString().split("T")[0]; // YYYY-MM-DD
          datesWithAppointments[dateKey] = true;
        });
        setHighlightedDates(datesWithAppointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };

    fetchAppointments();
  }, [userId]);

  // Update appointments for the selected date
  useEffect(() => {
    if (selectedDate) {
      const dateKey = selectedDate.toISOString().split("T")[0];
      const filteredAppointments = appointments.filter(
        (appointment) =>
          appointment.date.toISOString().split("T")[0] === dateKey
      );
      setAppointmentsForSelectedDate(filteredAppointments);
    } else {
      setAppointmentsForSelectedDate([]);
    }
  }, [selectedDate, appointments]);

  // Handle calendar tile content (highlighting dates with appointments)
  const tileContent = ({ date }: { date: Date }) => {
    const dateKey = date.toISOString().split("T")[0];
    return highlightedDates[dateKey] ? (
      <div className="appointment-marker" title="Appointments available"></div>
    ) : null;
  };

  // Handle calendar date selection
  const handleDateChange = (date: Date | null) => {
    if (date instanceof Date) {
      onDateChange(date);
    } else {
      onDateChange(null); // Clear if invalid date
    }
  };

  return (
    <div className="appointment-calendar">
      <h2>Appointment Calendar</h2>
      <Calendar
        onChange={(date) => handleDateChange(date as Date | null)}
        value={selectedDate}
        tileContent={tileContent}
        locale="en-US"
        className="custom-calendar"
      />

      <div className="appointments-list">
        {selectedDate && (
          <h3>Appointments for {selectedDate.toLocaleDateString("en-US")}</h3>
        )}
        {appointmentsForSelectedDate.length > 0 ? (
          <ul>
            {appointmentsForSelectedDate.map((appointment) => (
              <li key={appointment.appointmentId}>
                <strong>Faculty:</strong> {appointment.faculty} <br />
                <strong>Room:</strong> {appointment.room} <br />
                <strong>Status:</strong> {appointment.status} <br />
                <strong>Time:</strong>{" "}
                {new Date(appointment.date).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </li>
            ))}
          </ul>
        ) : (
          <p>
            {selectedDate
              ? "No appointments for this date."
              : "Select a date to view appointments."}
          </p>
        )}
      </div>
    </div>
  );
};

export default AppointmentCalendar;
