// src/components/AddUserForm.tsx

import React, { useState } from "react";
import { databaseService, UserData } from "../services/databaseService";
import "./AddUserForm.css";

const AddUserForm: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [faculty, setFaculty] = useState<string>("");
  const [role, setRole] = useState<"student" | "faculty" | "admin">("student"); // Include "admin" role
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [DOB, setDOB] = useState<string>(""); // Date of Birth
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>(""); // Store Firebase UID
  const [generatedId, setGeneratedId] = useState<string>(""); // Store generated ascending ID
  const [password, setPassword] = useState<string>("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate required fields
    if (!name || !email || !faculty || !DOB) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);

    try {
      // Fetch the next user ID based on the selected role
      const nextId = await databaseService.getNextUserId(role);
      setGeneratedId(nextId);

      const firstName = name.trim().split(" ")[0];
      const generatedPassword = `${firstName}${nextId}`;
      setPassword(generatedPassword);

      const userData: UserData = {
        name: name.trim(),
        email: email.trim(),
        faculty: faculty.trim(),
        role,
        password: generatedPassword, // Consider handling password securely
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        DOB,
        generatedId: nextId, // Include generatedId
      };

      // Add the user to Firebase Auth and Firestore
      const createdUserUid = await databaseService.addUser(userData);
      setUserId(createdUserUid);

      setSuccess(`User added successfully!`);
    } catch (error: any) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-user-form-container">
      <h2>Add User</h2>
      <form onSubmit={handleSubmit} className="add-user-form">
        <input
          type="text"
          placeholder="Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Faculty *"
          value={
            faculty ||
            "Institute of Computer Science & Digital Innovation (ICSDI)"
          }
          onChange={(e) => setFaculty(e.target.value)}
          required
        />
        <select
          value={role}
          onChange={(e) =>
            setRole(e.target.value as "student" | "faculty" | "admin")
          }
        >
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
        </select>
        <input
          type="tel"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          type="date"
          placeholder="Date of Birth *"
          value={DOB}
          onChange={(e) => setDOB(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add User"}
        </button>
      </form>

      {success && (
        <div className="success-message">
          <p>User added successfully!</p>
          <p>
            <strong>Generated ID:</strong> {generatedId}
          </p>
          <p>
            <strong>Password:</strong> {password}
          </p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default AddUserForm;
