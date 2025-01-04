// src/components/AppointmentCalendar.tsx

import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { appointmentService } from "../services/appointmentService";
import type { Appointment } from "../types/appointment";
import "../styles/AppointmentCalendar.css";
import { getFacilities } from "../services/databaseService";
import LoadingSpinner from "./LoadingSpinner";
interface AppointmentCalendarProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  userId: string;
  appointments?: Appointment[];
}

interface Facility {
  id: string;
  name: string;
  location: string;
  status: string;
  availableSlots: string[];
  capacity?: number;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  selectedDate,
  onDateChange,
  userId,
  appointments: propAppointments,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityMap, setFacilityMap] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch appointments
        if (propAppointments) {
          setAppointments(propAppointments);
        } else {
          const fetchedAppointments =
            await appointmentService.getAppointmentsForUser(userId);
          setAppointments(fetchedAppointments);
        }

        // Fetch facilities
        const fetchedFacilities = await getFacilities();
        setFacilities(fetchedFacilities);

        // Create a map of facility IDs to names for quick lookup
        const facilityIdNameMap: { [key: string]: string } = {};
        fetchedFacilities.forEach((facility) => {
          facilityIdNameMap[facility.id] = facility.name;
        });
        setFacilityMap(facilityIdNameMap);
      } catch (error) {
        console.error("Error fetching appointments or facilities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, propAppointments]);

  if (loading) {
    return (
      <div>
        Loading calendar... <LoadingSpinner />
      </div>
    );
  }

  const calendarEvents = appointments.map((appointment) => {
    // Get facility name if the meeting is physical
    const facilityName =
      appointment.meetingType === "physical" && appointment.facilityId
        ? facilityMap[appointment.facilityId] || appointment.facilityId
        : null;

    return {
      id: appointment.id,
      title: `${appointment.createdByName} - ${appointment.meetingType}`,
      start: new Date(
        `${appointment.date.toDateString()} ${appointment.startTime}`
      ),
      end: new Date(
        `${appointment.date.toDateString()} ${appointment.endTime}`
      ),
      backgroundColor: getStatusColor(appointment.status),
      extendedProps: {
        appointment,
        meetingType: appointment.meetingType,
        status: appointment.status,
        notes: appointment.notes,
        location:
          appointment.meetingType === "physical"
            ? facilityName
            : appointment.meetingLink,
        createdByName: appointment.createdByName,
      },
    };
  });

  function getStatusColor(status: string) {
    switch (status) {
      case "accepted":
        return "#28a745";
      case "rejected":
        return "#dc3545";
      case "cancelled":
        return "#6c757d";
      default:
        return "#ffc107";
    }
  }

  const renderEventContent = (eventInfo: any) => {
    const appointment = eventInfo.event.extendedProps.appointment;
    return (
      <div className={`calendar-event status-${appointment.status}`}>
        <div className="event-time">
          {appointment.startTime} - {appointment.endTime}
        </div>
        <div className="event-title">
          {appointment.meetingType === "online" ? "🌐" : "🏢"}
          {appointment.createdByName}
        </div>
        <div className="event-status">
          Status:{" "}
          {appointment.status.charAt(0).toUpperCase() +
            appointment.status.slice(1)}
        </div>
      </div>
    );
  };

  const handleEventClick = (info: any) => {
    const event = info.event;
    setSelectedEvent({
      title: event.title,
      date: event.start,
      endTime: event.end,
      meetingType: event.extendedProps.meetingType,
      status: event.extendedProps.status,
      notes: event.extendedProps.notes,
      location: event.extendedProps.location,
      createdByName: event.extendedProps.createdByName,
    });
  };

  return (
    <div className="appointment-calendar">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={calendarEvents}
        eventContent={renderEventContent}
        eventClassNames="calendar-event"
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        select={(info) => {
          onDateChange(info.start);
        }}
        eventClick={handleEventClick}
        height="auto"
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: false,
          hour12: false,
        }}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}
        slotDuration="00:30:00"
        expandRows={true}
        stickyHeaderDates={true}
        nowIndicator={true}
      />
      {selectedEvent && (
        <div
          className="appointment-details-modal"
          onClick={() => setSelectedEvent(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedEvent.createdByName}'s Appointment</h3>
            <p>
              <strong>Date:</strong> {selectedEvent.date.toLocaleDateString()}
            </p>
            <p>
              <strong>Time:</strong>{" "}
              {selectedEvent.date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              -{" "}
              {selectedEvent.endTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>
              <strong>Type:</strong>{" "}
              {selectedEvent.meetingType === "online"
                ? "🌐 Online"
                : "🏢 In-Person"}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span style={{ color: getStatusColor(selectedEvent.status) }}>
                {selectedEvent.status.toUpperCase()}
              </span>
            </p>
            {selectedEvent.location && (
              <p>
                <strong>
                  {selectedEvent.meetingType === "physical"
                    ? "Location"
                    : "Meeting Link"}
                  :
                </strong>{" "}
                {selectedEvent.meetingType === "online" ? (
                  <a
                    href={selectedEvent.location}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Meeting
                  </a>
                ) : (
                  selectedEvent.location
                )}
              </p>
            )}
            {selectedEvent.notes && (
              <p>
                <strong>Notes:</strong> {selectedEvent.notes}
              </p>
            )}
            <button onClick={() => setSelectedEvent(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;
