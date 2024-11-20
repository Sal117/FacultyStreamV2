import React, { useState } from "react";
import { addUser } from "../services/databaseService";
import "./AddUserForm.css";

const AddUserForm: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [faculty, setFaculty] = useState<string>("");
  const [role, setRole] = useState<"student" | "faculty">("student");
  const [password, setPassword] = useState<string>(""); // Store generated password
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helper function to generate a random password
  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let generatedPassword = "";
    for (let i = 0; i < 8; i++) {
      generatedPassword += chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
    }
    return generatedPassword;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !email || !faculty) {
      setError("Please fill all fields");
      return;
    }

    const generatedPassword = generatePassword();
    setPassword(generatedPassword);

    setLoading(true);

    try {
      const userData = {
        name,
        email,
        faculty,
        role,
        password: generatedPassword,
      }; // Include password in user data
      const userId = await addUser(userData);
      setSuccess(`User added with ID: ${userId}`);
      setName("");
      setEmail("");
      setFaculty("");
      setRole("student");
    } catch (error) {
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
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Faculty"
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "student" | "faculty")}
        >
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add User"}
        </button>
      </form>
      {password && (
        <p>
          Generated Password: <strong>{password}</strong>
        </p>
      )}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default AddUserForm;
