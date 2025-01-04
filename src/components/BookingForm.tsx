// src/components/BookingForm.tsx

import React, { useState, useEffect } from "react";
import "./BookingForm.css"; // Import the styles
import { appointmentService } from "../services/appointmentService";
import { useAuth } from "../context/AuthContext";
import { Appointment, AppointmentStatus } from "../types/appointment";

interface BookingFormProps {
  selectedDate: Date | null;
  users: { id: string; name: string; role: string }[];
  onBookingSuccess: (message: string) => void;
  onBookingError: (message: string) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  selectedDate,
  users,
  onBookingSuccess,
  onBookingError,
}) => {
  const { user } = useAuth();

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [room, setRoom] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("10:00");
  const [meetingType, setMeetingType] = useState<"online" | "physical">(
    "physical"
  );
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !selectedDate ||
      !selectedUserId ||
      !room ||
      !startTime ||
      !endTime ||
      !meetingType
    ) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (meetingType === "online" && !meetingLink) {
      setErrorMessage("Please provide a meeting link for online meetings.");
      return;
    }

    try {
      // Prepare appointment data
      const appointmentData: Omit<
        Appointment,
        "id" | "createdAt" | "updatedAt"
      > = {
        studentIds: [selectedUserId],
        date: selectedDate,
        facultyId: user?.uid || "", // Use current user's UID as facultyId
        facilityId: room,
        startTime,
        endTime,
        meetingType,
        meetingLink: meetingType === "online" ? meetingLink : null,
        status: "pending" as AppointmentStatus,
        createdBy: user?.uid || "",
        createdByRole: user?.role as "student" | "faculty",
        createdByName: user?.name || "",
        notes: "", // Provide default value for optional properties if necessary
      };

      // Call the appointmentService to add the appointment
      await appointmentService.addAppointment(appointmentData);

      onBookingSuccess("Appointment successfully booked!");
      setErrorMessage(null); // Clear any errors
      setSelectedUserId(""); // Reset selected user
      setRoom(""); // Reset room
      setStartTime("09:00"); // Reset start time
      setEndTime("10:00"); // Reset end time
      setMeetingType("physical"); // Reset meeting type
      setMeetingLink(null); // Reset meeting link
    } catch (error) {
      console.error("Error booking appointment:", error);
      onBookingError("Failed to book appointment. Please try again later.");
    }
  };

  useEffect(() => {
    setErrorMessage(null); // Clear errors when inputs change
  }, [
    selectedDate,
    selectedUserId,
    room,
    startTime,
    endTime,
    meetingType,
    meetingLink,
  ]);

  return (
    <form onSubmit={handleSubmit} className="booking-form">
      <h3>Book an Appointment</h3>

      <label htmlFor="date">Date:</label>
      <input
        type="text"
        id="date"
        name="date"
        value={selectedDate?.toLocaleDateString() || ""}
        readOnly
      />

      <label htmlFor="user">Select User:</label>
      <select
        id="user"
        name="user"
        value={selectedUserId}
        onChange={(e) => setSelectedUserId(e.target.value)}
      >
        <option value="">-- Select User --</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.role})
          </option>
        ))}
      </select>

      <label htmlFor="room">Room:</label>
      <input
        type="text"
        id="room"
        name="room"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        placeholder="Enter room details"
      />

      <label htmlFor="startTime">Start Time:</label>
      <input
        type="time"
        id="startTime"
        name="startTime"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
      />

      <label htmlFor="endTime">End Time:</label>
      <input
        type="time"
        id="endTime"
        name="endTime"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
      />

      <label htmlFor="meetingType">Meeting Type:</label>
      <select
        id="meetingType"
        name="meetingType"
        value={meetingType}
        onChange={(e) =>
          setMeetingType(e.target.value as "online" | "physical")
        }
      >
        <option value="physical">Physical</option>
        <option value="online">Online</option>
      </select>

      {meetingType === "online" && (
        <>
          <label htmlFor="meetingLink">Meeting Link:</label>
          <input
            type="url"
            id="meetingLink"
            name="meetingLink"
            value={meetingLink || ""}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="Enter meeting link"
          />
        </>
      )}

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <button type="submit">Book Appointment</button>
    </form>
  );
};

export default BookingForm;
