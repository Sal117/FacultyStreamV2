import React, { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import { databaseService } from "../../services/databaseService";
import "../../styles/FacilitiesBooking.css";
import Sidebar from "../../components/Sidebar";

// Define types for facilities and slots
interface Facility {
  id: string;
  name: string;
  location: string; // Include location
  status: string; // Include status
  availableSlots: string[]; // Ensure availableSlots is part of the Facility
  capacity?: number; // Optional capacity field
}

const FacilitiesBooking: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the list of facilities
    const fetchFacilities = async () => {
      try {
        setLoading(true);
        const facilitiesList: Facility[] =
          await databaseService.getFacilities();

        // Filter facilities with "pending" status
        const filteredFacilities = facilitiesList.filter(
          (facility) => facility.status !== "pending"
        );

        setFacilities(filteredFacilities);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching facilities:", error);
        setError("Error fetching facilities. Please try again later.");
        setLoading(false);
      }
    };

    fetchFacilities();
  }, []);

  const handleFacilityChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedFacility(event.target.value);
    setMessage(""); // Clear any previous messages
    setAvailableSlots([]); // Reset slots when facility changes
    setSelectedSlot(""); // Reset selected slot
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBookingDate(event.target.value);
    setMessage(""); // Clear any previous messages
    setAvailableSlots([]); // Reset slots when date changes
    setSelectedSlot(""); // Reset selected slot
  };

  const checkAvailability = async () => {
    if (!selectedFacility || !bookingDate) {
      setMessage("Please select a facility and a valid date.");
      return;
    }

    // Check if the selected date is in the past
    const selectedDate = new Date(bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    if (selectedDate < today) {
      setMessage(
        "You cannot book a facility for a past date. Please choose a future date."
      );
      return;
    }

    try {
      setLoading(true);
      const slots = await databaseService.getAvailableSlots(
        selectedFacility,
        Timestamp.fromDate(selectedDate)
      );
      setAvailableSlots(slots);
      setMessage(
        slots.length > 0 ? "" : "No slots available for the selected date."
      );
      setLoading(false);
    } catch (error) {
      console.error("Error checking availability:", error);
      setMessage("Error checking availability. Please try again later.");
      setLoading(false);
    }
  };

  const handleSlotSelection = (slot: string) => {
    setSelectedSlot(slot);
    setMessage(""); // Clear any previous messages
  };

  const handleBooking = async () => {
    if (!selectedSlot) {
      setMessage("Please select a time slot.");
      return;
    }

    try {
      setLoading(true);
      await databaseService.bookFacility(
        selectedFacility,
        selectedSlot,
        Timestamp.fromDate(new Date(bookingDate))
      );
      setMessage("Booking confirmed! Your slot is now reserved.");
      setAvailableSlots([]); // Clear available slots after booking
      setSelectedSlot(""); // Clear selected slot after booking
      setLoading(false);
    } catch (error) {
      console.error("Error booking facility:", error);
      setMessage("Error booking facility. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <div className="facilities-booking-container">
      <h2>Facilities Booking</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="booking-form">
        <label>Facility:</label>
        <select value={selectedFacility} onChange={handleFacilityChange}>
          <option value="">Select a facility</option>
          {facilities.map((facility) => (
            <option key={facility.id} value={facility.id}>
              <strong> {facility.name} </strong>- {facility.location}{" "}
              {facility.capacity ? `(Capacity: ${facility.capacity})` : ""}
            </option>
          ))}
        </select>

        <label>Date:</label>
        <input
          type="date"
          value={bookingDate}
          onChange={handleDateChange}
          min={new Date().toISOString().split("T")[0]} // Prevent past dates
        />

        <button
          onClick={checkAvailability}
          className="check-availability-btn"
          disabled={loading || selectedFacility === ""}
        >
          Check Availability
        </button>

        {availableSlots.length > 0 && (
          <div className="available-slots">
            <h4>Available Slots:</h4>
            <ul>
              {availableSlots.map((slot, index) => (
                <li
                  key={index}
                  onClick={() => handleSlotSelection(slot)}
                  className={selectedSlot === slot ? "selected" : ""}
                >
                  {slot}
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedSlot && (
          <div className="selected-slot">
            <p>Selected Slot: {selectedSlot}</p>
            <button
              onClick={handleBooking}
              className="confirm-booking-btn"
              disabled={loading}
            >
              Confirm Booking
            </button>
          </div>
        )}

        {message && <p className="booking-message">{message}</p>}
      </div>
    </div>
  );
};

export default FacilitiesBooking;
