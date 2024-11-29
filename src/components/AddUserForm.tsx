import React, { useState } from "react";
import { addUser } from "../services/databaseService";
import "./AddUserForm.css";

let facultyCounter = 200; // Starting ID for faculty
let studentCounter = 100; // Starting ID for students

const AddUserForm: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [faculty, setFaculty] = useState<string>("");
  const [role, setRole] = useState<"student" | "faculty">("student");
  const [password, setPassword] = useState<string>(""); // Store generated password
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [DOB, setDOB] = useState<string>(""); // Date of Birth
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>(""); // Store generated userId

  // Helper function to generate a userId based on the role
  const generateUserId = (): string => {
    if (role === "faculty") {
      return `${facultyCounter++}`;
    } else if (role === "student") {
      return `${studentCounter++}`;
    }
    return ""; // Fallback (should never hit)
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !email || !faculty || !DOB) {
      setError("Please fill all required fields");
      return;
    }

    const generatedId = generateUserId();
    setUserId(generatedId);

    const generatedPassword = `${name.split(" ")[0]}${generatedId}`; // First name + userId
    setPassword(generatedPassword);

    setLoading(true);

    try {
      const userData = {
        userId: generatedId, // Include generated userId
        name,
        email,
        faculty,
        role,
        password: generatedPassword,
        phoneNumber,
        address,
        DOB,
      }; // Include all fields in user data

      const createdUserId = await addUser(userData);
      setSuccess(`User added with ID: ${createdUserId}`);
      setName("");
      setEmail("");
      setFaculty("");
      setRole("student");
      setPhoneNumber("");
      setAddress("");
      setDOB("");
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
          placeholder="Date of Birth"
          value={DOB}
          onChange={(e) => setDOB(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add User"}
        </button>
      </form>
      {userId && (
        <p>
          Generated User ID: <strong>{userId}</strong>
        </p>
      )}
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
