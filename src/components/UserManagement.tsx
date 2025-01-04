// src/components/UserManagement.tsx

import React, { useEffect, useState } from "react";
import "./UserManagement.css";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { firebaseApp } from "../services/firebase";
import { formService } from "../services/formService";
import { FormTemplate } from "./types"; // Added centralized import
import { Modal, Button, message } from "antd";
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "faculty" | "student";
  permissions: string[]; // Array of FormTemplate IDs
}

const UserManagement: React.FC = () => {
  const db = getFirestore(firebaseApp);
  const [users, setUsers] = useState<User[]>([]);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // States for adding a new user
  const [newUserName, setNewUserName] = useState<string>("");
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [newUserRole, setNewUserRole] = useState<
    "admin" | "faculty" | "student"
  >("student");
  const [newUserPermissions, setNewUserPermissions] = useState<string[]>([]);

  // States for editing a user
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editUserRole, setEditUserRole] = useState<
    "admin" | "faculty" | "student"
  >("student");
  const [editUserPermissions, setEditUserPermissions] = useState<string[]>([]);

  // States for search and filter
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("all");

  useEffect(() => {
    const fetchUsersAndForms = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch Users
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const fetchedUsers: User[] = usersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "Unnamed User",
            email: data.email || "No Email Provided",
            role: data.role,
            permissions: data.permissions || [],
          };
        });
        setUsers(fetchedUsers);

        // Fetch FormTemplates for assigning permissions
        const formsCollection = collection(db, "FormTemplates");
        const formsSnapshot = await getDocs(formsCollection);
        const fetchedForms: FormTemplate[] = formsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          description: doc.data().description || "",
          studentFields: doc.data().studentFields || {}, // Provide default object if missing
          facultyFields: doc.data().facultyFields || {}, // Provide default object if missing
          fields: doc.data().fields || {}, // Include fields and provide a default value
          responsibleParties: doc.data().responsibleParties || [], // Provide default array if missing
          createdAt: doc.data().createdAt
            ? doc.data().createdAt.toDate()
            : new Date(), // Convert Firestore Timestamp to Date
          createdBy: doc.data().createdBy || "Unknown", // Provide default value if missing
        }));

        setFormTemplates(fetchedForms);
      } catch (err) {
        console.error("Error fetching users or form templates:", err);
        setError(
          "Failed to load users or form templates. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsersAndForms();
  }, [db]);

  const handleEditUser = (user: User) => {
    setEditUserId(user.id);
    setEditUserRole(user.role);
    setEditUserPermissions(user.permissions);
  };

  const handleUpdateUser = async (userId: string) => {
    try {
      setError(null);
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        role: editUserRole,
        permissions: editUserRole === "faculty" ? editUserPermissions : [],
      });

      // Refresh users list
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const fetchedUsers: User[] = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Unnamed User",
          email: data.email || "No Email Provided",
          role: data.role,
          permissions: data.permissions || [],
        };
      });
      setUsers(fetchedUsers);

      // Clear edit states
      setEditUserId(null);
      setEditUserRole("student");
      setEditUserPermissions([]);

      // Toast success message
      toast.success("User updated successfully!");
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Failed to update user. Please try again.");
      // Toast error message
      toast.error("Failed to update user. Please try again.");
    }
  };

  const handleDeleteUser = (userId: string) => {
    Modal.confirm({
      title: "Confirm Deletion",
      content: "Are you sure you want to delete this user?",
      okText: "Yes, Delete",
      cancelText: "Cancel",
      okType: "danger",
      onOk: async () => {
        try {
          // Clear any previous errors
          setError(null);

          // Delete the user document
          const userRef = doc(db, "users", userId);
          await deleteDoc(userRef);

          // Fetch and update the users list
          const usersCollection = collection(db, "users");
          const usersSnapshot = await getDocs(usersCollection);
          const fetchedUsers = usersSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || "Unnamed User",
              email: data.email || "No Email Provided",
              role: data.role,
              permissions: data.permissions || [],
            };
          });

          setUsers(fetchedUsers);
          message.success("User deleted successfully!"); // Show a success message
        } catch (err) {
          console.error("Error deleting user:", err);
          setError("Failed to delete user. Please try again.");
          message.error("Failed to delete user.");
        }
      },
      onCancel: () => {
        console.log("User deletion canceled.");
      },
    });
  };

  const filteredUsers = users.filter((user) => {
    const userName = user.name || "";
    const userEmail = user.email || "";

    const matchesSearch =
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "all" || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="user-management">
      <ToastContainer />
      <h2>User Management</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Search and Filter */}
      <div className="search-filter">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="faculty">Faculty</option>
          <option value="student">Student</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="users-table">
        <h3>Users List</h3>
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5}>No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      {editUserId === user.id ? (
                        <select
                          value={editUserRole}
                          onChange={(e) =>
                            setEditUserRole(
                              e.target.value as "admin" | "faculty" | "student"
                            )
                          }
                        >
                          <option value="student">Student</option>
                          <option value="faculty">Faculty</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        user.role.charAt(0).toUpperCase() + user.role.slice(1)
                      )}
                    </td>
                    <td>
                      {user.role === "faculty" ? (
                        editUserId === user.id ? (
                          <select
                            multiple
                            value={editUserPermissions}
                            onChange={(e) => {
                              const selectedOptions = Array.from(
                                e.target.selectedOptions,
                                (option) => option.value
                              );
                              setEditUserPermissions(selectedOptions);
                            }}
                          >
                            {formTemplates.map((form) => (
                              <option key={form.id} value={form.id}>
                                {form.name}
                              </option>
                            ))}
                          </select>
                        ) : user.permissions.length > 0 ? (
                          formTemplates
                            .filter((form) =>
                              user.permissions.includes(form.id)
                            )
                            .map((form) => form.name)
                            .join(", ")
                        ) : (
                          "None"
                        )
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td>
                      {editUserId === user.id ? (
                        <>
                          <button
                            onClick={() => handleUpdateUser(user.id)}
                            className="save-btn"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditUserId(null);
                              setEditUserRole("student");
                              setEditUserPermissions([]);
                            }}
                            className="cancel-btn"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="edit-btn"
                          >
                            Edit
                          </button>
                          <Button
                            type="primary"
                            danger // This adds the danger style in Ant Design
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
