import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./NavigationBar.css";
import isslogo from "../assets/images/IISv2_logo.webp";
import cnlogo from "../assets/images/CN_logo.png";

interface NavigationBarProps {
  isAuthenticated: boolean;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <a href="https://iisv2.ucsiuniversity.edu.my" className="logo-link">
          <img src={isslogo} alt="IISv2 Logo" className="logosmall" />
        </a>
        <a href="https://ucsi.thecn.com" className="logo-link">
          <img src={cnlogo} alt="CN Logo" className="logosmall" />
        </a>
      </div>
      <ul className="navbar-items">
        {!isAuthenticated ? (
          <>
            <li
              className="navbar-item"
              onClick={() => handleNavigation("/main")}
            >
              Home
            </li>
            <li
              className="navbar-item"
              onClick={() => handleNavigation("/login")}
            >
              Login
            </li>
          </>
        ) : (
          <>
            <li
              className="navbar-item"
              onClick={() => handleNavigation("/help")}
            >
              Help
            </li>
            <li
              className="navbar-item"
              onClick={() => handleNavigation("/notifications")}
            >
              Notifications
            </li>
            <li className="navbar-item" onClick={handleLogout}>
              Logout
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default NavigationBar;
