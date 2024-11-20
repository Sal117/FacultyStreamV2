import React from "react";
import "./UserManagement.css";

interface UserManagementProps {
  students: any[];
  faculties: any[];
}

const UserManagement: React.FC<UserManagementProps> = ({
  students,
  faculties,
}) => {
  return (
    <div className="user-management">
      <h3>Students</h3>
      <div className="user-list">
        {students.map((student, index) => (
          <div key={index} className="user-card">
            <p>Name: {student.name}</p>
            <p>Email: {student.email}</p>
          </div>
        ))}
      </div>

      <h3>Faculties</h3>
      <div className="user-list">
        {faculties.map((faculty, index) => (
          <div key={index} className="user-card">
            <p>Name: {faculty.name}</p>
            <p>Email: {faculty.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
