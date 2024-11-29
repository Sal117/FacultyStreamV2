import React from 'react';
import type { Appointment } from '../types/appointment';
import { userService } from '../services/userService';
import { facilityService } from '../services/facilityService';
import '../styles/AppointmentCard.css';

interface AppointmentCardProps {
  appointment: Appointment;
  currentUserRole: 'student' | 'faculty';
  onStatusChange?: (appointmentId: string, newStatus: Appointment['status']) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  currentUserRole,
  onStatusChange
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'accepted':
        return 'status-accepted';
      case 'rejected':
        return 'status-rejected';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className="appointment-card">
      <div className="appointment-header">
        <h3>Appointment for {formatDate(appointment.date)}</h3>
        <span className={`status-badge ${getStatusColor(appointment.status)}`}>
          {appointment.status}
        </span>
      </div>
      
      <div className="appointment-details">
        <div className="detail-row">
          <span className="label">Faculty:</span>
          <span className="value">{appointment.createdByName}</span>
        </div>

        {appointment.meetingType === 'physical' && appointment.facilityId && (
          <div className="detail-row">
            <span className="label">Room:</span>
            <span className="value">{appointment.facilityId}</span>
          </div>
        )}

        {appointment.meetingType === 'online' && appointment.meetingLink && (
          <div className="detail-row">
            <span className="label">Meeting Link:</span>
            <a 
              href={`https://${appointment.meetingLink}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="meeting-link"
            >
              {appointment.meetingLink}
            </a>
          </div>
        )}

        <div className="detail-row">
          <span className="label">Time:</span>
          <span className="value">{appointment.startTime} - {appointment.endTime}</span>
        </div>

        {appointment.notes && (
          <div className="detail-row">
            <span className="label">Notes:</span>
            <span className="value">{appointment.notes}</span>
          </div>
        )}
      </div>

      {currentUserRole === 'faculty' && appointment.status === 'pending' && onStatusChange && (
        <div className="appointment-actions">
          <button
            className="accept-btn"
            onClick={() => onStatusChange(appointment.id, 'accepted')}
          >
            Accept
          </button>
          <button
            className="reject-btn"
            onClick={() => onStatusChange(appointment.id, 'rejected')}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;
