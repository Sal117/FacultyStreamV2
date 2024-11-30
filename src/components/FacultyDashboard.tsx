import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import '../styles/FacultyDashboard.css';

interface Appointment {
  id: string;
  studentName: string;
  date: string;
  time: string;
  status: 'pending' | 'accepted' | 'rejected';
  purpose: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const FacultyDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!currentUser) return;

      try {
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('facultyId', '==', currentUser.uid),
          orderBy('date', 'desc')
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Appointment[];
        setAppointments(appointmentsData);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [currentUser]);

  const handleAccept = (appointmentId: string) => {
    // Implement accept logic
    console.log('Accept appointment:', appointmentId);
  };

  const handleReject = (appointmentId: string) => {
    // Implement reject logic
    console.log('Reject appointment:', appointmentId);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentDate);

  const renderCalendarDays = () => {
    const calendarDays = [];
    const today = new Date();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= days; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = 
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      
      const hasAppointments = appointments.some(
        app => new Date(app.date).toDateString() === date.toDateString()
      );

      calendarDays.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''} ${hasAppointments ? 'has-appointments' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <div className="calendar-day-number">{day}</div>
          {hasAppointments && <div className="appointment-dot" />}
        </div>
      );
    }

    return calendarDays;
  };

  const getSelectedDateAppointments = () => {
    if (!selectedDate) return [];
    return appointments.filter(
      app => new Date(app.date).toDateString() === selectedDate.toDateString()
    );
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="faculty-dashboard">
      <nav className="sidebar">
        <div className="logo-container">
          <img src="/logo.png" alt="USSI Logo" />
        </div>
        <Link to="/profile" className="nav-item">
          <i className="fas fa-user"></i>
          Profile
        </Link>
        <Link to="/appointments" className="nav-item active">
          <i className="fas fa-calendar"></i>
          Appointments
        </Link>
        <Link to="/chat" className="nav-item">
          <i className="fas fa-comments"></i>
          Chat
        </Link>
        <Link to="/dashboard" className="nav-item">
          <i className="fas fa-tachometer-alt"></i>
          Dashboard
        </Link>
        <Link to="/settings" className="nav-item">
          <i className="fas fa-cog"></i>
          Settings
        </Link>
      </nav>

      <div className="dashboard-content">
        <div className="top-bar">
          <div className="top-bar-right">
            <Link to="/help">Help</Link>
            <Link to="/notifications">Notifications</Link>
            <Link to="/logout">Logout</Link>
          </div>
        </div>

        <div className="main-content">
          <div className="calendar-section">
            <div className="calendar-header">
              <h2 className="calendar-title">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="calendar-nav">
                <button onClick={prevMonth}>
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button onClick={() => setCurrentDate(new Date())}>Today</button>
                <button onClick={nextMonth}>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>

            <div className="calendar-grid">
              {WEEKDAYS.map(day => (
                <div key={day} className="calendar-weekday">{day}</div>
              ))}
              {renderCalendarDays()}
            </div>

            {selectedDate && (
              <div className="appointment-list">
                <h3>
                  Appointments for {selectedDate.toLocaleDateString('default', { 
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
                {getSelectedDateAppointments().map(appointment => (
                  <div key={appointment.id} className="appointment-item">
                    <div className="appointment-time">{appointment.time}</div>
                    <div className="appointment-info">
                      <div className="appointment-title">
                        Appointment with {appointment.studentName}
                      </div>
                      <div className="appointment-purpose">{appointment.purpose}</div>
                    </div>
                    <span className={`appointment-status status-${appointment.status}`}>
                      {appointment.status}
                    </span>
                    {appointment.status === 'pending' && (
                      <div className="appointment-actions">
                        <button
                          className="btn btn-accept"
                          onClick={() => handleAccept(appointment.id)}
                        >
                          Accept
                        </button>
                        <button
                          className="btn btn-reject"
                          onClick={() => handleReject(appointment.id)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
