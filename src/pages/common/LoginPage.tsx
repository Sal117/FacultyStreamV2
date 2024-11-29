import React, { useState } from "react";
import "../../styles/LoginPage.css";
import PrimaryLogo from "../../assets/images/icdi_primary_logo.webp";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

interface LoginPageProps {
  setUserRole: (role: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ setUserRole }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await authService.login(email, password);
      console.log("Logged in user:", user);

      // Check if the role from the user matches the selected role
      if (user && user.role === selectedRole) {
        setUserRole(user.role); // Update role globally
        // Route based on the role
        if (user.role === "admin") navigate("/admin-dashboard");
        else if (user.role === "student") navigate("/student-dashboard");
        else if (user.role === "faculty") navigate("/faculty-dashboard");
      } else {
        setError(
          "Role does not match with the registered role for this email."
        );
      }
    } catch (error) {
      setError("Invalid credentials or role mismatch. Please try again.");
    }
  };

  const handleRoleSelection = (role: string) => {
    setSelectedRole(role);
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <img src={PrimaryLogo} alt="Primary Logo" className="primary-logo" />

        {/* 3D Role Selection */}
        <div className="role-selection">
          {["student", "faculty", "admin"].map((role) => (
            <div
              key={role}
              className={`role-card ${selectedRole === role ? "selected" : ""}`}
              onClick={() => handleRoleSelection(role)}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </div>
          ))}
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <label htmlFor="email" className="login-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="password" className="login-label">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="login-button">
            Login
          </button>

          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
