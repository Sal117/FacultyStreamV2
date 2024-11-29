import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/MainPage.css";
import backgroundImg from "../../assets/images/background.webp";
import facilityImg from "../../assets/images/facilities_booking.webp";
import profileImg from "../../assets/images/profile_placeholder.webp";
import chatbotImg from "../../assets/images/AI_chatbot.webp";

const faculties = [
  {
    name: "Institute of Computer Science & Digital Innovation (ICSDI)",
    role: "ICSDI",
  },
  {
    name: "Faculty of Engineering, Technology & Built Environment",
    role: "Engineering",
  },
  { name: "Faculty of Applied Sciences", role: "AppliedSciences" },
  {
    name: "Faculty of Pharmaceutical Sciences",
    role: "PharmaceuticalSciences",
  },
  { name: "Faculty of Business & Management", role: "BusinessManagement" },
  {
    name: "Faculty of Hospitality & Tourism Management",
    role: "HospitalityTourism",
  },
  { name: "Faculty of Creative Arts & Design", role: "CreativeArtsDesign" },
  { name: "Faculty of Social Sciences & Liberal Arts", role: "SocialSciences" },
  { name: "School of Architecture & Built Environment", role: "Architecture" },
];

const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFaculty, setSelectedFaculty] = useState(faculties[0]);

  const handleFacultyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = event.target.value;
    const faculty = faculties.find((f) => f.role === selectedRole);
    if (faculty) setSelectedFaculty(faculty);
  };

  const handleNavigate = () => {
    navigate(`/login?role=${selectedFaculty.role}`);
  };

  return (
    <div
      className="main-page"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        color: "#fff",
      }}
    >
      <div className="overlay">
        <header className="hero-section">
          <h1>Welcome to FacultyStream</h1>
          <p>
            Your Gateway to UCSI University’s Faculty Management System in
            Malaysia
          </p>
          <p>
            Explore UCSI University’s faculties and find the right one for you
          </p>
        </header>

        <section className="faculty-selection">
          <h2>Select Your Faculty</h2>
          <div className="dropdown-container">
            <select
              value={selectedFaculty.role}
              onChange={handleFacultyChange}
              className="dropdown"
            >
              {faculties.map((faculty) => (
                <option key={faculty.role} value={faculty.role}>
                  {faculty.name}
                </option>
              ))}
            </select>
            <button onClick={handleNavigate} className="navigate-button">
              Go
            </button>
          </div>
        </section>

        <section className="features-section">
          <h2>Why Choose FacultyStream?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <img src={facilityImg} alt="Facilities Booking" />
              <h3>Facilities Booking</h3>
              <p>
                Reserve labs, studios, and event spaces across UCSI University.
              </p>
            </div>
            <div className="feature-card">
              <img src={profileImg} alt="Profile Management" />
              <h3>Profile Management</h3>
              <p>
                Manage your academic profile, schedule classes, and stay
                connected.
              </p>
            </div>
            <div className="feature-card">
              <img src={chatbotImg} alt="AI Chatbot" />
              <h3>24/7 AI Chatbot Assistance</h3>
              <p>
                Instant support from an AI assistant for campus-related queries.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MainPage;
