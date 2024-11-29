import React, { useState, useEffect } from 'react';
import type { Appointment } from '../types/appointment';
import type { Facility } from '../services/facilityService';
import { userService } from '../services/userService';
import { facilityService } from '../services/facilityService';
import '../styles/AppointmentCard.css';

interface AppointmentCardProps {
  appointment: Appointment;
  currentUserRole: 'student' | 'faculty';
  onStatusChange?: (appointmentId: string, newStatus: Appointment['status']) => void;
  onReschedule?: (appointment: Appointment) => void;
  onDelete?: (appointmentId: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  currentUserRole,
  onStatusChange,
  onReschedule,
  onDelete
}) => {
  const [facilityDetails, setFacilityDetails] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFacilityDetails = async () => {
      if (appointment.meetingType === 'physical' && appointment.facilityId) {
        setLoading(true);
        try {
          const facilities = await facilityService.getAllFacilities();
          const facility = facilities.find(f => f.id === appointment.facilityId);
          if (facility) {
            setFacilityDetails(facility);
          }
        } catch (error) {
          console.error('Error fetching facility details:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFacilityDetails();
  }, [appointment.facilityId, appointment.meetingType]);

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

        <div className="detail-row">
          <span className="label">Time:</span>
          <span className="value">{appointment.startTime} - {appointment.endTime}</span>
        </div>

        {appointment.meetingType === 'physical' && appointment.facilityId && (
          <div className="detail-row">
            <span className="label">Facility:</span>
            <span className="value">
              {loading ? (
                "Loading..."
              ) : facilityDetails ? (
                `${facilityDetails.name} (${facilityDetails.location})`
              ) : (
                "Facility not found"
              )}
            </span>
          </div>
        )}

        {appointment.meetingType === 'online' && appointment.meetingLink && (
          <div className="detail-row">
            <span className="label">Meeting Link:</span>
            <span className="value">
              <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer">
                Join Meeting
              </a>
            </span>
          </div>
        )}

        {appointment.notes && (
          <div className="detail-row">
            <span className="label">Notes:</span>
            <span className="value">{appointment.notes}</span>
          </div>
        )}
      </div>

      <div className="appointment-actions">
        {currentUserRole === 'faculty' && appointment.status === 'pending' && onStatusChange && (
          <>
            <button
              onClick={() => onStatusChange(appointment.id, 'accepted')}
              className="accept-btn"
            >
              Accept
            </button>
            <button
              onClick={() => onStatusChange(appointment.id, 'rejected')}
              className="reject-btn"
            >
              Reject
            </button>
          </>
        )}
        {currentUserRole === 'faculty' && onDelete && (
          <button
            onClick={() => onDelete(appointment.id)}
            className="delete-btn"
          >
            Delete
          </button>
        )}
        {currentUserRole === 'faculty' && onReschedule && (
          <button
            onClick={() => onReschedule(appointment)}
            className="reschedule-btn"
          >
            Reschedule
          </button>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;
