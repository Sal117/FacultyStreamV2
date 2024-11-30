import React, { useEffect, useState } from "react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { appointmentService } from "../services/appointmentService";
import type { Appointment } from "../types/appointment";
import '../styles/AppointmentCalendar.css';

interface AppointmentCalendarProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
  userId: string;
  appointments?: Appointment[];
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  selectedDate,
  onDateChange,
  userId,
  appointments: propAppointments,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        if (propAppointments) {
          setAppointments(propAppointments);
        } else {
          const fetchedAppointments = await appointmentService.getAppointmentsForUser(userId);
          setAppointments(fetchedAppointments);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [userId, propAppointments]);

  if (loading) {
    return <div>Loading calendar...</div>;
  }

  const calendarEvents = appointments.map(appointment => ({
    id: appointment.id,
    title: `${appointment.createdByName} - ${appointment.meetingType}`,
    start: new Date(`${appointment.date.toDateString()} ${appointment.startTime}`),
    end: new Date(`${appointment.date.toDateString()} ${appointment.endTime}`),
    backgroundColor: getStatusColor(appointment.status),
    extendedProps: {
      appointment,
      meetingType: appointment.meetingType,
      status: appointment.status,
      notes: appointment.notes,
      location: appointment.meetingType === 'physical' ? appointment.facilityId : appointment.meetingLink,
      createdByName: appointment.createdByName
    }
  }));

  function getStatusColor(status: string) {
    switch (status) {
      case 'accepted':
        return '#28a745';
      case 'rejected':
        return '#dc3545';
      case 'cancelled':
        return '#6c757d';
      default:
        return '#ffc107';
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
          {appointment.meetingType === 'online' ? '🌐' : '🏢'} 
          {appointment.createdByName}
        </div>
        <div className="event-status">
          Status: {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
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
      createdByName: event.extendedProps.createdByName
    });
  };

  return (
    <div className="appointment-calendar">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
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
          hour: '2-digit',
          minute: '2-digit',
          meridiem: false,
          hour12: false
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
        <div className="appointment-details-modal" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{selectedEvent.createdByName}'s Appointment</h3>
            <p><strong>Date:</strong> {selectedEvent.date.toLocaleDateString()}</p>
            <p><strong>Time:</strong> {selectedEvent.date.toLocaleTimeString()} - {selectedEvent.endTime.toLocaleTimeString()}</p>
            <p><strong>Type:</strong> {selectedEvent.meetingType === 'online' ? '🌐 Online' : '🏢 In-Person'}</p>
            <p><strong>Status:</strong> <span style={{ color: getStatusColor(selectedEvent.status) }}>{selectedEvent.status.toUpperCase()}</span></p>
            {selectedEvent.location && (
              <p><strong>{selectedEvent.meetingType === 'physical' ? 'Location' : 'Meeting Link'}:</strong>{' '}
                {selectedEvent.meetingType === 'online' ? (
                  <a href={selectedEvent.location} target="_blank" rel="noopener noreferrer">Join Meeting</a>
                ) : (
                  selectedEvent.location
                )}
              </p>
            )}
            {selectedEvent.notes && (
              <p><strong>Notes:</strong> {selectedEvent.notes}</p>
            )}
            <button onClick={() => setSelectedEvent(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;
