import React, { useState, useEffect } from "react";
import "./BookingForm.css"; // Import the styles
import { appointmentService } from "../services/appointmentService";

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
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [room, setRoom] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedDate || !selectedUserId || !room) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    try {
      // Call the appointmentService to add the appointment
      await appointmentService.addAppointment({
        userId: selectedUserId,
        date: selectedDate,
        faculty: "", // Placeholder for faculty
        room,
        status: "pending", // Default status
      });

      onBookingSuccess("Appointment successfully booked!");
      setErrorMessage(null); // Clear any errors
      setSelectedUserId(""); // Reset selected user
      setRoom(""); // Reset room
    } catch (error) {
      console.error("Error booking appointment:", error);
      onBookingError("Failed to book appointment. Please try again later.");
    }
  };

  useEffect(() => {
    setErrorMessage(null); // Clear errors when inputs change
  }, [selectedDate, selectedUserId, room]);

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

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <button type="submit">Book Appointment</button>
    </form>
  );
};

export default BookingForm;
