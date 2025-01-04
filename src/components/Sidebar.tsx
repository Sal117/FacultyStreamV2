// src/components/Sidebar.tsx

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import { useTheme } from "./theme-provider"; // Importing the theme logic
import "./Sidebar.css";
import {
  FaUser,
  FaCalendar,
  FaFileAlt,
  FaHome,
  FaRobot,
  FaBuilding,
  FaCog,
  FaUsers,
  FaClipboardList,
  FaTools, // Icon for AdminFacilitiesAndAppointments
  FaComments, // Icon for ChatPage
  FaBars, // Icon for the toggle button
} from "react-icons/fa";

interface SidebarProps {
  userRole: string;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Get current location
  const { theme } = useTheme(); // Fetch the current theme
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSidebarActive, setIsSidebarActive] = useState(true);

  // Toggle functions
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleSidebarMobile = () => setIsSidebarActive(!isSidebarActive);

  // Menu items based on user role
  const getMenuItems = () => {
    // Common items for all users
    const commonItems = [
      { label: "Profile", icon: <FaUser />, path: "/profile" },
      {
        label: "Facilities",
        icon: <FaBuilding />,
        path: "/facilities-booking",
      },
      { label: "Appointments", icon: <FaCalendar />, path: "/appointment" },
      { label: "Chat", icon: <FaComments />, path: "/chat" },
      { label: "Chatbot", icon: <FaRobot />, path: "/chatbot" },
    ];

    // Admin-specific items
    if (userRole === "admin") {
      return [
        { label: "Dashboard", icon: <FaHome />, path: "/admin-dashboard" },
        { label: "Forms", icon: <FaClipboardList />, path: "/admin-forms" },
        { label: "System Settings", icon: <FaCog />, path: "/system-settings" },
        {
          label: "User Management",
          icon: <FaUsers />,
          path: "/user-management",
        },
        {
          label: "Facilities & Appointments",
          icon: <FaTools />,
          path: "/admin-facilities-appointments",
        },
        ...commonItems,
      ];
    }

    // Faculty-specific items
    if (userRole === "faculty") {
      return [
        { label: "Dashboard", icon: <FaHome />, path: "/faculty-dashboard" },
        {
          label: "Documents",
          icon: <FaFileAlt />,
          path: "/document-management",
        },
        { label: "Forms", icon: <FaClipboardList />, path: "/faculty-forms" },
        {
          label: "Appointment Management",
          icon: <FaCalendar />,
          path: "/appointment-management",
        },
        ...commonItems,
      ];
    }

    // Student-specific items
    if (userRole === "student") {
      return [
        { label: "Dashboard", icon: <FaHome />, path: "/student-dashboard" },
        { label: "Documents", icon: <FaFileAlt />, path: "/documents-access" },
        { label: "Forms", icon: <FaClipboardList />, path: "/student-forms" },
        ...commonItems,
      ];
    }

    // Default to common items if no role is matched
    return commonItems;
  };

  // Determine the correct logo based on the theme
  const logoSrc =
    theme === "light"
      ? "src/assets/images/sidebarLogo_light.png"
      : "src/assets/images/SidebarLogo_dark.png";

  return (
    <>
      {/* Sidebar Toggle Button for Mobile */}
      <button className="sidebar-toggle-btn" onClick={toggleSidebarMobile}>
        <FaBars />
      </button>

      <aside
        className={`sidebar ${isCollapsed ? "collapsed" : ""} ${
          isSidebarActive ? "active" : ""
        }`}
      >
        <div className="logo-section" onClick={toggleSidebar}>
          <img src={logoSrc} alt="Sidebar Logo" className="logo" />
        </div>
        <ul className="nav-list">
          {getMenuItems().map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li
                key={item.path}
                className={`nav-item ${isActive ? "active" : ""}`}
                data-label={item.label}
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                {!isCollapsed && <span>{item.label}</span>}
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
