import React, { useEffect, useState } from "react";
import {
  getAllUsers,
  updateUser,
  deleteUserById,
  getAppointments,
} from "../../services/databaseService";
import { User, Appointment } from "../../components/types";
import "../../styles/UserManagement.css";
import Sidebar from "../../components/Sidebar";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [selectedUserAppointments, setSelectedUserAppointments] = useState<{
    user: User;
    appointments: Appointment[];
  } | null>(null);

  // States for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

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
      // Toast success message
      toast.success(
        `User status updated successfully to ${
          isActive ? "Active" : "Inactive"
        }!`
      );
    } catch (err) {
      setError("Error updating user status.");
      console.error("Error updating user status:", err);
      // Toast error message
      toast.error("Failed to update user status. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setActionLoading(true);
    setError("");
    try {
      await deleteUserById(userToDelete.userId);
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.userId !== userToDelete.userId)
      );
      toast.success(`User "${userToDelete.name}" deleted successfully!`);
    } catch (err) {
      setError("Error deleting user.");
      toast.error(`Failed to delete user "${userToDelete.name}".`);
      console.error("Error deleting user:", err);
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

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
      <ToastContainer /> {/* Toast notifications */}
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
                      onClick={() => {
                        setUserToDelete(user);
                        setDeleteDialogOpen(true);
                      }}
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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          aria-labelledby="delete-confirmation-dialog"
          aria-describedby="delete-confirmation-description"
        >
          <DialogTitle id="delete-confirmation-dialog" style={{ color: "red" }}>
            Delete User
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-confirmation-description">
              Are you sure you want to delete{" "}
              <strong>{userToDelete?.name}</strong>? This action cannot be
              undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              color="secondary"
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              color="primary"
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>

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
