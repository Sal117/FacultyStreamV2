import React, { useState, useEffect } from "react";

import "react-calendar/dist/Calendar.css";
import "../../styles/Appointment.css";
import { appointmentService } from "../../services/appointmentService";
import { notificationService } from "../../services/notificationService";
import { googleMeetService } from "../../services/googleMeetService";
import { databaseService } from "../../services/databaseService";
import { Timestamp } from "firebase/firestore";
import AppointmentCalendar from "../../components/AppointmentCalendar";
interface User {
  id: string;
  name: string;
  role: "student" | "faculty";
}

interface Facility {
  id: string;
  name: string;
  location: string;
  status: string;
  availableSlots: string[];
}

interface Appointment {
  appointmentId: string;
  userId: string;
  date: Date;
  faculty: string;
  room: string;
  reason?: string;
  status: "pending" | "confirmed" | "cancelled" | "rejected";
  meetingLink?: string;
}
interface AppointmentCalendarProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  userId: string; // Dynamic userId to fetch appointments
}

const Appointment: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [appointmentReason, setAppointmentReason] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [useOnlineMeeting, setUseOnlineMeeting] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);

  const [highlightedDates, setHighlightedDates] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const usersData = (await appointmentService.getAllUsers()).map(
          (user) => ({
            ...user,
            role:
              user.role === "student" || user.role === "faculty"
                ? user.role
                : "student", // Ensure role validity
          })
        ) as User[];

        const facilitiesData = await databaseService.getFacilities();

        const allAppointments = await appointmentService.getAppointmentsForUser(
          "logged-in-user-id"
        );

        const datesWithAppointments: { [key: string]: boolean } = {};

        allAppointments.forEach((appointment) => {
          const dateKey =
            appointment.date instanceof Timestamp
              ? appointment.date.toDate().toLocaleDateString("en-US")
              : appointment.date instanceof Date
              ? appointment.date.toLocaleDateString("en-US")
              : ""; // Fallback for unexpected types

          if (dateKey) {
            datesWithAppointments[dateKey] = true;
          }
        });

        setUsers(usersData);
        setFacilities(facilitiesData);
        setAppointments(
          allAppointments.map((appointment) => ({
            ...appointment,
            date:
              appointment.date instanceof Timestamp
                ? appointment.date.toDate()
                : appointment.date, // Ensure date is of type Date
          }))
        );

        setHighlightedDates(datesWithAppointments);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, []);

  const handleDateChange = (value: Date | Date[] | null) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    } else if (Array.isArray(value) && value.length > 0) {
      setSelectedDate(value[0]); // Use the first date in the range
    } else {
      setSelectedDate(null); // Clear the selection
    }
  };

  const handleCreateAppointment = async () => {
    if (
      !selectedUser ||
      !selectedDate ||
      !appointmentReason ||
      (!selectedRoom && !useOnlineMeeting)
    ) {
      setNotification("Please fill all the required fields.");
      return;
    }

    const appointmentData: Omit<Appointment, "appointmentId"> = {
      userId: selectedUser,
      faculty: "logged-in-faculty-id",
      date: selectedDate!,
      room: selectedRoom,
      reason: appointmentReason,
      status: "pending",
    };

    try {
      let meetingLink = "";
      if (useOnlineMeeting) {
        const link = await googleMeetService.createGoogleMeetEvent({
          summary: "Appointment Meeting",
          description: appointmentReason,
          start: selectedDate.toISOString(),
          end: new Date(selectedDate.getTime() + 30 * 60000).toISOString(), // 30 minutes duration
          attendees: [{ email: "user@example.com" }], // Replace with real user email
        });
        meetingLink = link ?? ""; // Default to an empty string if null
        appointmentData.meetingLink = meetingLink;
      }

      const newAppointment = await appointmentService.addAppointment({
        ...appointmentData,
        reason: appointmentReason, // Ensure 'reason' is included
      });

      await notificationService.notify({
        message: `You have a new appointment request for ${selectedDate.toLocaleDateString()}`,
        type: "info",
        userId: selectedUser ?? "",
        timestamp: Timestamp.now(),
      });

      setNotification("Appointment created successfully!");
    } catch (error) {
      console.error("Error creating appointment:", error);
      setNotification("Failed to create appointment.");
    }
  };

  const handleAppointmentStatusChange = async (
    appointmentId: string,
    newStatus: "confirmed" | "rejected" | "cancelled"
  ) => {
    try {
      await appointmentService.updateAppointment(appointmentId, {
        status: newStatus,
      });

      if (newStatus === "confirmed" || newStatus === "rejected") {
        const appointment = appointments.find(
          (a) => a.appointmentId === appointmentId
        );
        if (appointment) {
          await notificationService.notify({
            message: `Your appointment has been ${newStatus}.`,
            type: "info",
            userId: appointment.userId,
            timestamp: Timestamp.now(),
          });
        }
      }

      const updatedAppointments = appointments.map((appointment) =>
        appointment.appointmentId === appointmentId
          ? { ...appointment, status: newStatus }
          : appointment
      );

      setAppointments(updatedAppointments);
      setNotification(`Appointment ${newStatus} successfully!`);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      setNotification("Failed to update appointment status.");
    }
  };
  //function to highlight dates with Google Calendar events
  const tileContent = ({ date }: { date: Date }) => {
    const dateKey = date.toISOString().split("T")[0];
    if (highlightedDates[dateKey]) {
      return <div className="appointment-marker"></div>;
    }

    const googleEvent = googleEvents.find((event: any) =>
      event.start?.dateTime
        ? new Date(event.start.dateTime).toISOString().split("T")[0] === dateKey
        : false
    );

    if (googleEvent) {
      return <div className="google-event-marker"></div>; // Custom marker for Google events
    }

    return null;
  };

  return (
    <div className="appointment-container">
      <h2>Appointment Booking</h2>
      {notification && <div className="notification">{notification}</div>}
      {/* Use AppointmentCalendar component */}

      <div className="calendar-section">
        <AppointmentCalendar
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          userId={" "}
        />
      </div>

      <div className="form-section">
        <label>User:</label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Select User</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.role === "faculty"
                ? `Faculty: ${user.name}`
                : `Student: ${user.name}`}
            </option>
          ))}
        </select>

        <label>Room:</label>
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
        >
          <option value="">Select Room</option>
          {facilities.map((facility) => (
            <option key={facility.id} value={facility.name}>
              {facility.name} - {facility.location}
            </option>
          ))}
        </select>

        <label>Reason:</label>
        <textarea
          value={appointmentReason}
          onChange={(e) => setAppointmentReason(e.target.value)}
        />

        <label>
          <input
            type="checkbox"
            checked={useOnlineMeeting}
            onChange={(e) => setUseOnlineMeeting(e.target.checked)}
          />
          Online Meeting
        </label>

        <button onClick={handleCreateAppointment}>Create Appointment</button>
      </div>

      <div className="appointments-list">
        <h3>Appointments</h3>
        {appointments.map((appointment) => (
          <div key={appointment.appointmentId} className="appointment-item">
            <p>
              <strong>Date:</strong> {appointment.date.toLocaleDateString()}
            </p>
            <p>
              <strong>Time:</strong> {appointment.date.toLocaleTimeString()}
            </p>
            <p>
              <strong>User:</strong>{" "}
              {users.find((u) => u.id === appointment.userId)?.name ||
                "Unknown"}
            </p>
            <p>
              <strong>Room:</strong> {appointment.room}
            </p>
            <p>
              <strong>Reason:</strong> {appointment.reason}
            </p>
            <p>
              <strong>Status:</strong> {appointment.status}
            </p>
            {appointment.meetingLink && (
              <p>
                <strong>Meeting Link:</strong>{" "}
                <a
                  href={appointment.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join
                </a>
              </p>
            )}
            {appointment.status === "pending" && (
              <div className="appointment-actions">
                <button
                  onClick={() =>
                    handleAppointmentStatusChange(
                      appointment.appointmentId,
                      "confirmed"
                    )
                  }
                >
                  Confirm
                </button>
                <button
                  onClick={() =>
                    handleAppointmentStatusChange(
                      appointment.appointmentId,
                      "rejected"
                    )
                  }
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="google-events-list">
        <h3>Google Calendar Events</h3>
        {googleEvents.map((event: any) => (
          <div key={event.id} className="google-event-item">
            <p>
              <strong>Title:</strong> {event.summary || "No Title"}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {event.start?.dateTime
                ? new Date(event.start.dateTime).toLocaleDateString()
                : "Unknown"}
            </p>
            <p>
              <strong>Time:</strong>{" "}
              {event.start?.dateTime
                ? new Date(event.start.dateTime).toLocaleTimeString()
                : "Unknown"}
            </p>
            {event.hangoutLink && (
              <p>
                <strong>Google Meet Link:</strong>{" "}
                <a
                  href={event.hangoutLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join
                </a>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Appointment;
