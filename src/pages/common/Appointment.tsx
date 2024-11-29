import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { appointmentService } from "../../services/appointmentService";
import { userService } from "../../services/userService";
import { facilityService } from "../../services/facilityService";
import type { User as FirebaseUser } from "firebase/auth";
import type { Facility } from "../../types/facility";
import type { Appointment as AppointmentType } from "../../types/appointment";
import AppointmentCalendar from "../../components/AppointmentCalendar";
import Sidebar from "../../components/Sidebar";
import NotificationBanner from "../../components/NotificationBanner";
import LoadingSpinner from "../../components/LoadingSpinner";
import { generateGoogleMeetLink } from "../../utils/meetingUtils";
import Select from 'react-select';
import "../../styles/Appointment.css";
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface AppUser {
  id: string;
  name: string;
  email: string;
  department?: string;
  role: 'student' | 'faculty' | 'admin';
}

interface SelectOption {
  value: string;
  label: string;
}

const Appointment: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [meetingType, setMeetingType] = useState<'online' | 'physical'>('online');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [currentUserData, setCurrentUserData] = useState<AppUser | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingLink, setMeetingLink] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [fetchedUsers, fetchedFacilities, currentUser] = await Promise.all([
          userService.getAllUsers(),
          facilityService.getAllFacilities(),
          userService.getUserById(user.uid)
        ]);

        if (!currentUser) {
          throw new Error('Current user data not found');
        }

        setCurrentUserData(currentUser as AppUser);
        
        // Filter users based on current user's role and remove duplicates and incomplete entries
        const filteredUsers = currentUser.role === 'student'
          ? fetchedUsers
              .filter(u => u.role === 'faculty' && u.name && u.name.trim() !== '')
              .filter((user, index, self) => 
                index === self.findIndex((u) => u.id === user.id)
              )
          : fetchedUsers
              .filter(u => u.role === 'student' && u.name && u.name.trim() !== '')
              .filter((user, index, self) => 
                index === self.findIndex((u) => u.id === user.id)
              );
        
        setUsers(filteredUsers as AppUser[]);
        setFacilities(fetchedFacilities);
      } catch (error) {
        console.error('Error fetching data:', error);
        setNotification({
          type: 'error',
          message: 'Failed to load users and facilities'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedDate || selectedUsers.length === 0) return;

      try {
        const availableSlots = new Set(generateTimeSlots());

        for (const userId of selectedUsers) {
          const userAppointments = await appointmentService.getAppointmentsForUser(userId);
          const dateAppointments = userAppointments.filter(app => 
            app.date.toDateString() === selectedDate.toDateString()
          );

          dateAppointments.forEach(app => {
            availableSlots.delete(`${app.startTime}-${app.endTime}`);
          });
        }

        setAvailableTimeSlots(Array.from(availableSlots));
      } catch (error) {
        console.error("Error checking availability:", error);
        setNotification({
          type: 'error',
          message: 'Failed to check availability'
        });
      }
    };

    checkAvailability();
  }, [selectedDate, selectedUsers]);

  useEffect(() => {
    if (meetingType === 'online') {
      setMeetingLink(generateGoogleMeetLink());
    } else {
      setMeetingLink('');
    }
  }, [meetingType]);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      slots.push(`${startTime}-${endTime}`);
    }
    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !currentUserData || !selectedDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const appointmentData: Omit<AppointmentType, 'id' | 'createdAt' | 'updatedAt'> = {
        date: selectedDate,
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        meetingType,
        status: 'pending',
        createdBy: user.uid,
        createdByName: currentUserData.name,
        createdByRole: currentUserData.role === 'admin' ? 'faculty' : currentUserData.role,
        facultyId: currentUserData.role === 'student' ? selectedUsers[0] : user.uid,
        studentIds: currentUserData.role === 'student' ? [user.uid] : selectedUsers,
        notes,
        meetingLink: meetingType === 'online' ? meetingLink : null,
        facilityId: meetingType === 'physical' ? selectedFacility : null
      };

      await appointmentService.createAppointment(appointmentData);
      toast.success('Appointment created successfully!');
      navigate('/student-dashboard');
    } catch (error) {
      console.error('Error creating appointment:', error);
      if (error instanceof Error) {
        if (error.message.includes('time slot is not available')) {
          toast.error('This time slot is already booked with the selected faculty member. Please choose a different date or time.');
        } else if (error.message.includes('Facility is not available')) {
          toast.error('The selected facility is not available at this time. Please choose a different facility or time slot.');
        } else {
          toast.error(error.message || 'Failed to create appointment. Please try again.');
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert users to select options
  const userOptions = users.map(user => ({
    value: user.id,
    label: user.name + (user.department ? ` (${user.department})` : '')
  }));

  // Get selected options for the Select component
  const selectedOptions = userOptions.filter(option => 
    selectedUsers.includes(option.value)
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUserData) {
    return <div>Error: User data not found</div>;
  }

  return (
    <div className="appointment-container">
      {notification && (
        <NotificationBanner
          notification={{
            id: '1',
            type: notification.type,
            message: notification.message,
            timestamp: new Date()
          }}
          onClose={() => setNotification(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="appointment-form">
        <div className="form-group">
          <label>Meeting Type:</label>
          <select 
            value={meetingType}
            onChange={(e) => setMeetingType(e.target.value as 'online' | 'physical')}
          >
            <option value="online">Online Meeting</option>
            <option value="physical">Physical Meeting</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            {currentUserData.role === 'student' 
              ? 'Select Faculty Member:' 
              : 'Select Student(s):'
            }
          </label>
          {currentUserData.role === 'faculty' ? (
            <div className="select-container">
              <Select
                isMulti
                options={userOptions}
                value={selectedOptions}
                onChange={(selected) => {
                  const selectedValues = (selected as SelectOption[]).map(option => option.value);
                  setSelectedUsers(selectedValues);
                }}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Search and select students..."
                isSearchable
                closeMenuOnSelect={false}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '45px',
                    background: 'var(--background)',
                    borderColor: 'var(--border)',
                    '&:hover': {
                      borderColor: 'var(--primary)'
                    }
                  }),
                  menu: (base) => ({
                    ...base,
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }),
                  option: (base, state) => ({
                    ...base,
                    background: state.isFocused 
                      ? 'var(--primary-light)' 
                      : state.isSelected 
                        ? 'var(--primary)'
                        : 'transparent',
                    color: state.isSelected ? 'white' : 'var(--text)',
                    '&:hover': {
                      background: 'var(--primary-light)'
                    }
                  }),
                  multiValue: (base) => ({
                    ...base,
                    background: 'var(--primary-light)'
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: 'var(--primary)'
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: 'var(--primary)',
                    '&:hover': {
                      background: 'var(--primary)',
                      color: 'white'
                    }
                  })
                }}
              />
            </div>
          ) : (
            <Select
              options={userOptions}
              value={selectedOptions[0]}
              onChange={(selected) => {
                const selectedValue = (selected as SelectOption)?.value;
                setSelectedUsers(selectedValue ? [selectedValue] : []);
              }}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select a faculty member..."
              isSearchable
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '45px',
                  background: 'var(--background)',
                  borderColor: 'var(--border)',
                  '&:hover': {
                    borderColor: 'var(--primary)'
                  }
                }),
                menu: (base) => ({
                  ...base,
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }),
                option: (base, state) => ({
                  ...base,
                  background: state.isFocused 
                    ? 'var(--primary-light)' 
                    : state.isSelected 
                      ? 'var(--primary)'
                      : 'transparent',
                  color: state.isSelected ? 'white' : 'var(--text)',
                  '&:hover': {
                    background: 'var(--primary-light)'
                  }
                })
              }}
            />
          )}
        </div>

        <div className="form-group">
          <label>Date:</label>
          <AppointmentCalendar
            selectedDate={selectedDate}
            onDateChange={(date) => setSelectedDate(date)}
            userId={user?.uid || ''}
          />
        </div>

        {availableTimeSlots.length > 0 && (
          <div className="form-group">
            <label>Available Time Slots:</label>
            <select
              value={`${selectedStartTime}-${selectedEndTime}`}
              onChange={(e) => {
                const [start, end] = e.target.value.split('-');
                setSelectedStartTime(start);
                setSelectedEndTime(end);
              }}
            >
              <option value="">-- Select Time Slot --</option>
              {availableTimeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        )}

        {meetingType === 'online' && (
          <div className="form-group">
            <label>Meeting Link:</label>
            <input
              type="text"
              value={meetingLink}
              readOnly
              className="meeting-link-input"
            />
          </div>
        )}

        {meetingType === 'physical' && (
          <div className="form-group">
            <label>Select Facility:</label>
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              required={meetingType === 'physical'}
            >
              <option value="">-- Select Facility --</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name} - {facility.location} (Capacity: {facility.capacity})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Notes:</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes or agenda for the meeting"
          />
        </div>

        <button 
          className="submit-button"
          type="submit"
          disabled={!selectedDate || selectedUsers.length === 0 || !selectedStartTime || !selectedEndTime || (meetingType === 'physical' && !selectedFacility) || isSubmitting}
        >
          {currentUserData.role === 'student' 
            ? 'Request Appointment' 
            : 'Create Appointment'
          }
        </button>
      </form>
    </div>
  );
};

export default Appointment;
