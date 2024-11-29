import React, { useState, useEffect } from "react";
import "../../styles/AdminFacilitiesAndAppointments.css";
import Sidebar from "../../components/Sidebar";
import NotificationBanner from "../../components/NotificationBanner";
import LoadingSpinner from "../../components/LoadingSpinner";

import { appointmentService } from "../../services/appointmentService";
import facilitiesService from "../../services/facilitiesService";
import { authService } from "../../services/authService";

import Button from "../../components/Button";
import { Timestamp } from "firebase/firestore";

interface Facility {
  id: string;
  name: string;
  location: string;
  status: string;
  availableSlots: string[];
  capacity?: number;
}

interface Appointment {
  appointmentId: string;
  userId: string;
  date: Date;
  faculty: string;
  room: string;
  status: "pending" | "confirmed" | "cancelled" | "rejected";
}

const AdminFacilitiesAndAppointments: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [newFacilityCapacity, setNewFacilityCapacity] = useState<number | "">(
    ""
  );

  const [notification, setNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [newFacilitySlots, setNewFacilitySlots] = useState<string[]>([]);

  const [newFacilityName, setNewFacilityName] = useState<string>("");
  const [newFacilityLocation, setNewFacilityLocation] = useState<string>("");

  const [slotInput, setSlotInput] = useState<string>("");

  // Fetch admin authentication and data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch facilities
        const fetchedFacilities = await facilitiesService.getFacilities();
        setFacilities(fetchedFacilities);

        // Fetch appointments
        const fetchedAppointments =
          await appointmentService.getAllAppointments(); // Fixed method name
        const formattedAppointments = fetchedAppointments.map(
          (appointment: Appointment) => ({
            ...appointment,
            date:
              appointment.date instanceof Timestamp
                ? appointment.date.toDate() // Convert Timestamp to Date
                : new Date(appointment.date), // Handle cases where it's already a Date
          })
        );
        setAppointments(formattedAppointments);
        setFilteredAppointments(formattedAppointments);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setNotification("Error fetching data. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddSlot = () => {
    if (slotInput && !newFacilitySlots.includes(slotInput)) {
      setNewFacilitySlots([...newFacilitySlots, slotInput]);
      setSlotInput(""); // Clear the input field
    }
  };

  const handleRemoveSlot = (index: number) => {
    setNewFacilitySlots(newFacilitySlots.filter((_, i) => i !== index));
  };

  // Filter appointments based on status
  const handleStatusFilterChange = (status: string) => {
    setFilterStatus(status);
    if (status === "all") {
      setFilteredAppointments(appointments);
    } else {
      setFilteredAppointments(
        appointments.filter((appointment) => appointment.status === status)
      );
    }
  };

  // Check facility availability
  const checkAvailability = async () => {
    if (!selectedFacility || !bookingDate) {
      setNotification("Please select a facility and a date.");
      return;
    }
    try {
      setLoading(true);
      const slots = await facilitiesService.getAvailableSlots(
        selectedFacility,
        Timestamp.fromDate(new Date(bookingDate))
      );
      setAvailableSlots(slots);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      setNotification("Failed to fetch available slots.");
      setLoading(false);
    }
  };

  // Book a facility
  const handleFacilityBooking = async () => {
    if (!selectedSlot) {
      setNotification("Please select a time slot.");
      return;
    }
    try {
      setLoading(true);
      await facilitiesService.bookFacility(
        selectedFacility,
        selectedSlot,
        Timestamp.fromDate(new Date(bookingDate)),
        adminId!
      );
      setNotification("Facility booked successfully!");
      setAvailableSlots([]);
      setLoading(false);
    } catch (error) {
      console.error("Error booking facility:", error);
      setNotification("Failed to book facility.");
      setLoading(false);
    }
  };

  // Add a new facility
  const handleAddFacility = async () => {
    if (
      !newFacilityName ||
      !newFacilityLocation ||
      newFacilitySlots.length === 0
    ) {
      setNotification("Please provide all details including available slots.");
      return;
    }

    try {
      setLoading(true);
      const facilityId = await facilitiesService.addFacility({
        name: newFacilityName,
        location: newFacilityLocation,
        availableSlots: newFacilitySlots,
        capacity: newFacilityCapacity || 0,
        status: "active", // Default status
      });
      setFacilities([
        ...facilities,
        {
          id: facilityId,
          name: newFacilityName,
          location: newFacilityLocation,
          availableSlots: newFacilitySlots,
          capacity: newFacilityCapacity || 0,
          status: "active",
        },
      ]);
      setNewFacilityName("");
      setNewFacilityLocation("");
      setNewFacilitySlots([]);
      setNewFacilityCapacity("");
      setNotification("Facility added successfully!");
      setLoading(false);
    } catch (error) {
      console.error("Error adding facility:", error);
      setNotification("Failed to add facility.");
      setLoading(false);
    }
  };

  // Remove a facility
  const handleRemoveFacility = async (facilityId: string) => {
    try {
      setLoading(true);
      await facilitiesService.removeFacility(facilityId);
      setFacilities(
        facilities.filter((facility) => facility.id !== facilityId)
      );
      setNotification("Facility removed successfully!");
      setLoading(false);
    } catch (error) {
      console.error("Error removing facility:", error);
      setNotification("Failed to remove facility.");
      setLoading(false);
    }
  };
  // Update facility status
  const handleFacilityStatusChange = async (
    facilityId: string,
    status: string
  ) => {
    try {
      setLoading(true);
      await facilitiesService.updateFacilityStatus(facilityId, status);
      const updatedFacilities = facilities.map((facility) =>
        facility.id === facilityId ? { ...facility, status } : facility
      );
      setFacilities(updatedFacilities);
      setNotification(
        `Facility status updated to ${
          status === "pending" ? "Pending" : "Active"
        }`
      );
      setLoading(false);
    } catch (error) {
      console.error("Error updating facility status:", error);
      setNotification("Failed to update facility status.");
      setLoading(false);
    }
  };

  // Update appointment status
  const handleAppointmentStatusChange = async (
    appointmentId: string,
    newStatus: "confirmed" | "cancelled"
  ) => {
    try {
      setLoading(true);
      await appointmentService.updateAppointment(appointmentId, {
        status: newStatus,
      });
      const updatedAppointments = appointments.map((appointment) =>
        appointment.appointmentId === appointmentId
          ? { ...appointment, status: newStatus }
          : appointment
      );
      setAppointments(updatedAppointments);
      setFilteredAppointments(updatedAppointments);
      setNotification(`Appointment ${newStatus} successfully!`);
      setLoading(false);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      setNotification("Failed to update appointment status.");
      setLoading(false);
    }
  };

  return (
    <div className="admin-facilities-appointments">
      <main className="content">
        <h1>Admin: Facilities and Appointments</h1>

        {notification && (
          <NotificationBanner
            notification={{
              id: "temp-id", // Provide a unique temporary ID if notification lacks one
              type: "info", // Specify the type
              message: notification, // Use the notification content
              timestamp: new Date(), // Add a timestamp
            }}
            onClose={() => setNotification(null)}
          />
        )}

        {loading && <LoadingSpinner overlay={true} />}

        {/* Add Facility Section */}
        <section className="add-facility-section">
          <h2>Add Facility</h2>
          <div className="add-facility-controls">
            <input
              type="text"
              placeholder="Facility Name"
              value={newFacilityName}
              onChange={(e) => setNewFacilityName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Facility Location"
              value={newFacilityLocation}
              onChange={(e) => setNewFacilityLocation(e.target.value)}
            />
            <input
              type="number"
              placeholder="Capacity"
              value={newFacilityCapacity}
              onChange={(e) => setNewFacilityCapacity(Number(e.target.value))}
            />

            <div className="slot-management">
              <h4>Available Slots</h4>
              <div className="add-slot">
                <input
                  type="time"
                  value={slotInput}
                  onChange={(e) => setSlotInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleAddSlot()}
                  disabled={!slotInput}
                >
                  Add Slot
                </button>
              </div>
              <ul className="slot-list">
                {newFacilitySlots.map((slot, index) => (
                  <li key={index}>
                    {slot}{" "}
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(index)}
                      className="remove-slot-btn"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <Button text="Add Facility" onClick={handleAddFacility} />
          </div>
        </section>

        {/* manag Facility Section */}
        <section className="manage-facility-section">
          <h2>Manage Facilities</h2>
          <ul>
            {facilities.map((facility) => (
              <li key={facility.id}>
                <strong>{facility.name || "unknown"}</strong> -{" "}
                {facility.location} -{" "}
                {facility.capacity
                  ? `Capacity: ${facility.capacity}`
                  : "No Capacity"}{" "}
                - Status: {facility.status}
                <div className="facility-actions">
                  <Button
                    text={facility.status === "pending" ? "Unpend" : "Pend"}
                    onClick={() =>
                      handleFacilityStatusChange(
                        facility.id,
                        facility.status === "pending" ? "active" : "pending"
                      )
                    }
                  />
                  <Button
                    text="Remove"
                    onClick={() => handleRemoveFacility(facility.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Facilities Booking Section */}
        <section className="facilities-section">
          <h2>Facilities Management</h2>
          <div className="facility-controls">
            <label>Facility:</label>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
            >
              <option value="">Select a facility</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name} - {facility.location}
                </option>
              ))}
            </select>

            <label>Date:</label>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />

            <Button
              text="Check Availability"
              onClick={checkAvailability}
              className="availability-btn"
            />
          </div>

          {availableSlots.length > 0 && (
            <div className="available-slots">
              <h4>Available Slots:</h4>
              <ul>
                {availableSlots.map((slot, index) => (
                  <li
                    key={index}
                    className={selectedSlot === slot ? "selected" : ""}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot}
                  </li>
                ))}
              </ul>

              <Button
                text="Book Facility"
                onClick={handleFacilityBooking}
                className="booking-btn"
              />
            </div>
          )}
        </section>

        {/* Appointments Management Section */}
        <section className="appointments-section">
          <h2>Appointments Management</h2>
          <div className="filter-controls">
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

          <div className="appointments-list">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.appointmentId} className="appointment-card">
                <p>
                  <strong>Date:</strong> {appointment.date.toLocaleDateString()}
                </p>
                <p>
                  <strong>Room:</strong> {appointment.room}
                </p>
                <p>
                  <strong>Faculty:</strong> {appointment.faculty}
                </p>
                <p>
                  <strong>Status:</strong> {appointment.status}
                </p>
                {appointment.status === "pending" && (
                  <div className="actions">
                    <Button
                      text="Confirm"
                      onClick={() =>
                        handleAppointmentStatusChange(
                          appointment.appointmentId,
                          "confirmed"
                        )
                      }
                    />
                    <Button
                      text="Cancel"
                      onClick={() =>
                        handleAppointmentStatusChange(
                          appointment.appointmentId,
                          "cancelled"
                        )
                      }
                    />{" "}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminFacilitiesAndAppointments;
