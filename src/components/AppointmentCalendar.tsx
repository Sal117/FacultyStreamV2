import React, { useEffect, useState } from "react";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { appointmentService } from "../services/appointmentService";
import type { Appointment } from "../types/appointment";
import "./AppointmentCalendar.css";

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

  const calendarEvents = appointments.map(appointment => ({
    id: appointment.id,
    title: `Appointment with ${appointment.createdByName}`,
    start: new Date(`${appointment.date.toDateString()} ${appointment.startTime}`),
    end: new Date(`${appointment.date.toDateString()} ${appointment.endTime}`),
    className: `appointment-${appointment.status}`,
    extendedProps: {
      meetingType: appointment.meetingType,
      status: appointment.status,
      notes: appointment.notes
    }
  }));

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
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        select={(info) => {
          onDateChange(info.start);
        }}
        eventClick={(info) => {
          console.log('Event clicked:', info.event);
        }}
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
    </div>
  );
};

export default AppointmentCalendar;
