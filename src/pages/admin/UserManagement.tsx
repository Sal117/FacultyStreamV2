// src/pages/admin/UserManagement.tsx

import React, { useEffect, useState } from "react";
import {
  getAllUsers,
  updateUser,
  deleteUser,
  getAppointments,
} from "../../services/databaseService";
import { User, Appointment } from "../../components/types"; // Importing both User and Appointment types
import "../../styles/UserManagement.css";
import Sidebar from "../../components/Sidebar";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal"; // Assume you have a Modal component

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [selectedUserAppointments, setSelectedUserAppointments] = useState<{
    user: User;
    appointments: Appointment[];
  } | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const fetchedUsers = await getAllUsers();
        if (Array.isArray(fetchedUsers)) {
          setUsers(
            fetchedUsers.map((user) => ({
              ...user,
              isActive: user.isActive ?? false,
            }))
          );
        }
      } catch (err) {
        setError("Failed to load users.");
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  /**
   * Handles toggling the active status of a user.
   * @param userId - The ID of the user.
   * @param isActive - The new active status.
   */
  const handleStatusChange = async (userId: string, isActive: boolean) => {
    setActionLoading(true);
    setError("");
    try {
      await updateUser(userId, { isActive });
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userId === userId ? { ...user, isActive } : user
        )
      );
    } catch (err) {
      setError("Error updating user status.");
      console.error("Error updating user status:", err);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handles deleting a user.
   * @param userId - The ID of the user to delete.
   */
  const handleDeleteUser = async (userId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    );
    if (!confirmDelete) return;

    setActionLoading(true);
    setError("");
    try {
      await deleteUser(userId);
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.userId !== userId)
      );
    } catch (err) {
      setError("Error deleting user.");
      console.error("Error deleting user:", err);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Fetches and displays appointments for a specific user.
   * @param user - The user whose appointments are to be fetched.
   */
  const handleViewAppointments = async (user: User) => {
    setActionLoading(true);
    setError("");
    try {
      const appointments = await getAppointments(user.userId);
      setSelectedUserAppointments({
        user,
        appointments,
      });
    } catch (err) {
      setError("Failed to fetch appointments.");
      console.error("Error fetching appointments:", err);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Closes the appointments modal.
   */
  const closeModal = () => {
    setSelectedUserAppointments(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
        <p>Loading Users...</p>
      </div>
    );
  }

  return (
    <div className="user-management-page">
      {/* Assuming Sidebar is managed globally or via routing */}
      <div className="user-management-container">
        <h1 className="page-title">User Management</h1>
        {actionLoading && (
          <div className="action-loading">
            <LoadingSpinner />
            <p>Processing...</p>
          </div>
        )}
        {error && <p className="error-message">{error}</p>}
        <table className="user-management-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
              <th>Appointments</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.userId}>
                  <td>{user.name}</td>
                  <td>{user.email || "No Email Provided"}</td>
                  <td>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </td>
                  <td
                    className={`status ${
                      user.isActive ? "active" : "inactive"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </td>
                  <td>
                    <button
                      className={`action-button ${
                        user.isActive ? "deactivate-btn" : "activate-btn"
                      }`}
                      onClick={() =>
                        handleStatusChange(user.userId, !user.isActive)
                      }
                      disabled={actionLoading}
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="action-button delete-btn"
                      onClick={() => handleDeleteUser(user.userId)}
                      disabled={actionLoading}
                    >
                      Delete
                    </button>
                  </td>
                  <td>
                    <button
                      className="action-button view-appointments-btn"
                      onClick={() => handleViewAppointments(user)}
                      disabled={actionLoading}
                    >
                      View Appointments
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="no-users">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Appointments Modal */}
        {selectedUserAppointments && (
          <Modal onClose={closeModal} title={""} isOpen={true}>
            <div className="appointments-modal">
              <h2>Appointments for {selectedUserAppointments.user.name}</h2>
              {selectedUserAppointments.appointments.length > 0 ? (
                <table className="appointments-table">
                  <thead>
                    <tr>
                      <th>Appointment ID</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedUserAppointments.appointments.map(
                      (appointment) => (
                        <tr key={appointment.appointmentId}>
                          <td>{appointment.appointmentId}</td>
                          <td>{new Date(appointment.date).toLocaleString()}</td>
                          <td>{appointment.status}</td>
                          <td>{appointment.details || "N/A"}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              ) : (
                <p>No appointments found for this user.</p>
              )}
              <button className="close-modal-button" onClick={closeModal}>
                Close
              </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
