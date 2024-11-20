import React, { useEffect, useState } from "react";
import { appointmentService } from "../../services/appointmentService";
import { googleMeetService } from "../../services/googleMeetService";
import { notificationService } from "../../services/notificationService";
import { Timestamp } from "firebase/firestore";
import { authService, CustomUser } from "../../services/authService";
import { Appointment } from "../../components/types";

const AppointmentPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newAppointment, setNewAppointment] = useState({
    summary: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    attendees: [] as { email: string }[],
  });

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
        if (user) {
          const userAppointments =
            await appointmentService.getAppointmentsForUser(user.uid);
          // Convert Firestore Timestamps to Dates
          const convertedAppointments = userAppointments.map((appointment) => ({
            ...appointment,
            date: new Date(appointment.date), // Ensure date is a Date object
          }));
          setAppointments(convertedAppointments);
        }
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError("Failed to fetch appointments.");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewAppointment({ ...newAppointment, [name]: value });
  };

  const handleAddAppointment = async () => {
    const { summary, description, date, startTime, endTime, attendees } =
      newAppointment;

    if (!summary || !date || !startTime || !endTime) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);
      const meetLink = await googleMeetService.createGoogleMeetEvent({
        summary,
        description,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        attendees,
      });

      const appointmentData: Omit<Appointment, "appointmentId"> = {
        userId: currentUser?.uid || "",
        faculty: currentUser?.faculty || "",
        room: "Online (Google Meet)",
        date: startDateTime, // This is a Date object
        reason: description,
        status: "pending",
        meetingLink: meetLink || "",
      };

      await appointmentService.addAppointment({
        ...appointmentData,
        date: startDateTime, // Convert to Firestore Timestamp when saving
      });

      await notificationService.notify({
        userId: currentUser?.uid || "",
        message: `New appointment created for ${summary} on ${date}`,
        type: "success",
        timestamp: Timestamp.now(),
      });

      setNewAppointment({
        summary: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        attendees: [],
      });

      const updatedAppointments =
        await appointmentService.getAppointmentsForUser(currentUser?.uid || "");
      const convertedAppointments = updatedAppointments.map((appointment) => ({
        ...appointment,
        date: new Date(appointment.date), // Convert Timestamp back to Date when fetching
      }));
      setAppointments(convertedAppointments);

      console.log("Appointment successfully created!");
    } catch (err) {
      console.error("Error adding appointment:", err);
      setError("Failed to create appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="appointment-page">
      <h1>Appointments</h1>

      {error && <p className="error-message">{error}</p>}

      <div className="new-appointment-form">
        <h2>Create New Appointment</h2>
        <input
          type="text"
          name="summary"
          placeholder="Summary"
          value={newAppointment.summary}
          onChange={handleInputChange}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={newAppointment.description}
          onChange={handleInputChange}
        />
        <input
          type="date"
          name="date"
          value={newAppointment.date}
          onChange={handleInputChange}
        />
        <input
          type="time"
          name="startTime"
          value={newAppointment.startTime}
          onChange={handleInputChange}
        />
        <input
          type="time"
          name="endTime"
          value={newAppointment.endTime}
          onChange={handleInputChange}
        />
        <button onClick={handleAddAppointment} disabled={loading}>
          {loading ? "Creating..." : "Create Appointment"}
        </button>
      </div>

      <div className="appointment-list">
        <h2>My Appointments</h2>
        {appointments.map((appointment) => (
          <div key={appointment.appointmentId} className="appointment-item">
            <p>
              <strong>Summary:</strong> {appointment.reason}
            </p>
            <p>
              <strong>Date:</strong> {appointment.date.toLocaleString()}{" "}
              {/* Convert Date to readable format */}
            </p>
            <p>
              <strong>Status:</strong> {appointment.status}
            </p>
            {appointment.meetingLink && (
              <p>
                <strong>Google Meet:</strong>{" "}
                <a
                  href={appointment.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {appointment.meetingLink}
                </a>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentPage;
