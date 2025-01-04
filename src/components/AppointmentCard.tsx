// src/components/AppointmentCard.tsx

import React, { useState, useEffect } from "react";
import type { Appointment } from "../types/appointment";
import type { Facility } from "../types/facility";
import { getFacilities } from "../services/databaseService";
import "../styles/AppointmentCard.css";
import LoadingSpinner from "./LoadingSpinner";
interface AppointmentCardProps {
  appointment: Appointment;
  currentUserRole: "student" | "faculty";
  onStatusChange?: (
    appointmentId: string,
    newStatus: Appointment["status"]
  ) => void;
  onReschedule?: (appointment: Appointment) => void;
  onDelete?: (appointmentId: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  currentUserRole,
  onStatusChange,
  onReschedule,
  onDelete,
}) => {
  const [facilityName, setFacilityName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFacilityName = async () => {
      if (appointment.meetingType === "physical" && appointment.facilityId) {
        setLoading(true);
        try {
          const facilities = await getFacilities();
          const facilityMap: { [key: string]: string } = {};
          facilities.forEach((facility) => {
            facilityMap[facility.id] = facility.name;
          });
          const name =
            facilityMap[appointment.facilityId] || appointment.facilityId;
          setFacilityName(name);
        } catch (error) {
          console.error("Error fetching facility details:", error);
          setFacilityName("Facility not found");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchFacilityName();
  }, [appointment.facilityId, appointment.meetingType]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: Appointment["status"]) => {
    switch (status) {
      case "accepted":
        return "status-accepted";
      case "rejected":
        return "status-rejected";
      case "cancelled":
        return "status-cancelled";
      default:
        return "status-pending";
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
          <span className="label">
            {currentUserRole === "student" ? "Faculty:" : "Student(s):"}
          </span>
          <span className="value">{appointment.createdByName}</span>
        </div>

        <div className="detail-row">
          <span className="label">Time:</span>
          <span className="value">
            {appointment.startTime} - {appointment.endTime}
          </span>
        </div>

        {appointment.meetingType === "physical" && appointment.facilityId && (
          <div className="detail-row">
            <span className="label">Facility:</span>
            <span className="value">
              {loading ? <LoadingSpinner /> : facilityName}
            </span>
          </div>
        )}

        {appointment.meetingType === "online" && appointment.meetingLink && (
          <div className="detail-row">
            <span className="label">Meeting Link:</span>
            <span className="value">
              <a
                href={appointment.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
              >
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
        {currentUserRole === "faculty" &&
          appointment.status === "pending" &&
          onStatusChange && (
            <>
              <button
                onClick={() => onStatusChange(appointment.id, "accepted")}
                className="accept-btn"
              >
                Accept
              </button>
              <button
                onClick={() => onStatusChange(appointment.id, "rejected")}
                className="reject-btn"
              >
                Reject
              </button>
            </>
          )}
        {currentUserRole === "faculty" && onDelete && (
          <button
            onClick={() => onDelete(appointment.id)}
            className="delete-btn"
          >
            Delete
          </button>
        )}
        {currentUserRole === "faculty" && onReschedule && (
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
