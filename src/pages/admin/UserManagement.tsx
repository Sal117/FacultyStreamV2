import React, { useEffect, useState } from "react";
import { getAllUsers, updateUser } from "../../services/databaseService";
import { User } from "../../components/types"; // Correctly importing the User type
import "../../styles/UserManagement.css";
import Sidebar from "../../components/Sidebar";
import { appointmentService } from "../../services/appointmentService"; // Import the appointmentService to manage appointments

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await getAllUsers();
        if (Array.isArray(fetchedUsers)) {
          setUsers(
            fetchedUsers.map((user) => ({
              ...user,
              isActive: user.isActive ?? false,
            }))
          ); // Ensure all users have isActive defined
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Handle status change for users (active or inactive)
  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      await updateUser(userId, { isActive });
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userId === userId ? { ...user, isActive } : user
        )
      );
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  // Fetch user appointments - This will fetch appointments related to a user
  const fetchAppointments = async (userId: string) => {
    try {
      const appointments = await appointmentService.getAppointmentsForUser(
        userId
      );
      console.log("Appointments for user:", appointments);
      return appointments;
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>User Management</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Active</th>
            <th>Actions</th>
            <th>Appointments</th> {/* New column for appointments */}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.userId}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.isActive ? "Yes" : "No"}</td>
              <td>
                <button
                  onClick={() =>
                    handleStatusChange(user.userId, !user.isActive)
                  }
                >
                  Toggle Active
                </button>
              </td>
              <td>
                <button
                  onClick={async () => {
                    const appointments = await fetchAppointments(user.userId);
                    console.log(`Appointments for ${user.name}:`, appointments);
                  }}
                >
                  View Appointments
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
