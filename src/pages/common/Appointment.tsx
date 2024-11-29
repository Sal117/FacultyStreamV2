import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { appointmentService } from "../../services/appointmentService";
import { userService } from "../../services/userService";
import { facilityService } from "../../services/facilityService";
import type { User } from "../../services/userService";
import type { Facility } from "../../types/facility";
import type { Appointment as AppointmentType } from "../../types/appointment";
import AppointmentCalendar from "../../components/AppointmentCalendar";
import Sidebar from "../../components/Sidebar";
import NotificationBanner from "../../components/NotificationBanner";
import LoadingSpinner from "../../components/LoadingSpinner";
import "../../styles/Appointment.css";

const Appointment: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [meetingType, setMeetingType] = useState<'online' | 'physical'>('online');
  const [notification, setNotification] = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<User | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingLink, setMeetingLink] = useState<string>("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (!user?.uid) return;

        // Fetch current user data
        const userData = await userService.getUserById(user.uid);
        if (userData) {
          setCurrentUserData({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            department: userData.department
          });

          // Fetch relevant users based on current user's role
          const relevantUsers = userData.role === 'student' 
            ? await userService.getFacultyMembers()
            : await userService.getStudents();
          setUsers(relevantUsers.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            department: u.department
          })));
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setNotification("Failed to load initial data");
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user]);

  // Load facilities when meeting type changes to physical
  useEffect(() => {
    const loadFacilities = async () => {
      if (meetingType === 'physical') {
        try {
          const facilitiesData = await facilityService.getAllFacilities();
          setFacilities(facilitiesData);
        } catch (error) {
          console.error("Error loading facilities:", error);
          setNotification("Failed to load facilities");
        }
      }
    };

    loadFacilities();
  }, [meetingType]);

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
        setNotification("Failed to check availability");
      }
    };

    checkAvailability();
  }, [selectedDate, selectedUsers]);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      slots.push(`${startTime}-${endTime}`);
    }
    return slots;
  };

  const handleCreateAppointment = async () => {
    if (!currentUserData || selectedUsers.length === 0 || !selectedDate || !selectedStartTime || !selectedEndTime) {
      setNotification("Please fill all required fields");
      return;
    }

    try {
      const appointmentData = {
        facultyId: currentUserData.role === 'faculty' ? currentUserData.id : selectedUsers[0],
        studentIds: currentUserData.role === 'student' ? [currentUserData.id] : selectedUsers,
        date: selectedDate,
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        meetingType,
        meetingLink: meetingType === 'online' ? meetingLink : undefined,
        facilityId: meetingType === 'physical' ? selectedFacility : undefined,
        notes,
        status: currentUserData.role === 'faculty' ? 'accepted' : 'pending',
        createdBy: currentUserData.id,
        createdByRole: currentUserData.role as 'faculty' | 'student',
        createdByName: currentUserData.name
      };

      await appointmentService.addAppointmentWithSecondaryUser(appointmentData, currentUserData.name);
      setNotification("Appointment created successfully!");
      
      // Reset form
      setSelectedUsers([]);
      setSelectedDate(null);
      setSelectedStartTime("");
      setSelectedEndTime("");
      setNotes("");
      setMeetingLink("");
      setSelectedFacility("");
    } catch (error) {
      console.error("Error creating appointment:", error);
      setNotification("Failed to create appointment");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUserData) {
    return <div>Error: User data not found</div>;
  }

  return (
    <div className="appointment-container">
      <Sidebar userRole={currentUserData.role} />
      
      <div className="appointment-content">
        <h2>Book an Appointment</h2>
        
        {notification && (
          <NotificationBanner 
            notification={{
              id: 'notification',
              type: notification.includes('success') ? 'success' : 'error',
              message: notification,
              timestamp: new Date()
            }}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="appointment-form">
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
            <label>
              {currentUserData.role === 'student' 
                ? 'Select Faculty Member:' 
                : 'Select Student(s):'
              }
            </label>
            <select
              multiple={currentUserData.role === 'faculty'}
              value={selectedUsers}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedUsers(currentUserData.role === 'faculty' ? values : [values[0]]);
              }}
              className={currentUserData.role === 'faculty' ? 'multiple-select' : ''}
            >
              <option value="">-- Select {currentUserData.role === 'student' ? 'Faculty' : 'Students'} --</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} {user.department ? `(${user.department})` : ''}
                </option>
              ))}
            </select>
            {currentUserData.role === 'faculty' && (
              <small className="help-text">
                Hold Ctrl (Windows) or Command (Mac) to select multiple students
              </small>
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
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="Enter meeting link (optional)"
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
            onClick={handleCreateAppointment}
            disabled={!selectedDate || selectedUsers.length === 0 || !selectedStartTime || !selectedEndTime || (meetingType === 'physical' && !selectedFacility)}
          >
            {currentUserData.role === 'student' 
              ? 'Request Appointment' 
              : 'Create Appointment'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default Appointment;
