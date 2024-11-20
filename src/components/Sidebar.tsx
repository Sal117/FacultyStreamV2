import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";
import SecondaryLogo from "../assets/images/ICSDI_secondary_logo.webp";
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
  FaTools, // Added a new icon for AdminFacilitiesAndAppointments
} from "react-icons/fa";

interface SidebarProps {
  userRole: string;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

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
      { label: "Chatbot", icon: <FaRobot />, path: "/chatbot" },
    ];

    // Admin-specific items
    if (userRole === "admin") {
      return [
        ...commonItems,
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
      ];
    }

    // Faculty-specific items
    if (userRole === "faculty") {
      return [
        ...commonItems,
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
      ];
    }

    // Student-specific items
    if (userRole === "student") {
      return [
        ...commonItems,
        { label: "Dashboard", icon: <FaHome />, path: "/student-dashboard" },
        {
          label: "Documents",
          icon: <FaFileAlt />,
          path: "/documents-access",
        },
        { label: "Forms", icon: <FaClipboardList />, path: "/student-forms" },
      ];
    }

    // Default to common items if no role is matched
    return commonItems;
  };

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="logo-section" onClick={toggleSidebar}>
        <img src={SecondaryLogo} alt="ICSDI Logo" className="logo" />
      </div>
      <ul className="nav-list">
        {getMenuItems().map((item) => (
          <li
            key={item.path}
            className="nav-item"
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            {!isCollapsed && <span>{item.label}</span>}
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
