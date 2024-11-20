import React, { useState, useEffect } from "react";
import {
  getCurrentUser,
  updateUserProfile,
  changeUserPassword,
} from "../../services/authService";
import profilePic from "../../assets/images/profile_placeholder.webp";
import "../../styles/ProfilePage.css";

const ProfilePage: React.FC = () => {
  const [userData, setUserData] = useState<any>({});
  const [editing, setEditing] = useState<boolean>(false);
  const [updatedName, setUpdatedName] = useState<string>("");
  const [updatedEmail, setUpdatedEmail] = useState<string>("");
  const [updatedFaculty, setUpdatedFaculty] = useState<string>("");
  const [profilePicture, setProfilePicture] = useState<string | null>(
    profilePic
  );
  const [loading, setLoading] = useState<boolean>(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] =
    useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
  const [passwordUpdateError, setPasswordUpdateError] = useState<string | null>(
    null
  );
  const [passwordUpdateMessage, setPasswordUpdateMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = await getCurrentUser();
      if (user) {
        setUserData(user);
        setUpdatedName(user.name || "");
        setUpdatedEmail(user.email || "");
        setUpdatedFaculty(user.faculty || "");
        setProfilePicture(user.profilePicture || profilePic);
      }
    };
    fetchUserData();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateUserProfile({
        name: updatedName,
        email: updatedEmail,
        faculty: updatedFaculty,
      });
      setUserData({
        ...userData,
        name: updatedName,
        email: updatedEmail,
        faculty: updatedFaculty,
        profilePicture,
      });
      setEditing(false);
    } catch (error) {
      console.error("Profile update failed: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => setProfilePicture(reader.result as string);
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmNewPassword) {
      setPasswordUpdateError("Passwords do not match.");
      return;
    }

    try {
      // Validate the current password first before proceeding
      await changeUserPassword(currentPassword, newPassword); // This will throw an error if currentPassword is wrong
      setPasswordUpdateError(null);
      setPasswordUpdateMessage("Password updated successfully!");
      setIsPasswordModalOpen(false); // Close the modal after success
    } catch (error) {
      setPasswordUpdateMessage(null);
      setPasswordUpdateError("Failed to update password. Please try again.");
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>{userData.name}'s Profile</h1>
      </div>
      <div className="profile-card">
        <div className="profile-picture-container">
          <img
            src={profilePicture || profilePic}
            alt="Profile"
            className="profile-picture"
          />
          {editing && (
            <input
              type="file"
              onChange={handleProfilePictureChange}
              className="upload-input"
            />
          )}
        </div>
        <div className="profile-details">
          {editing ? (
            <>
              <label>Name:</label>
              <input
                type="text"
                value={updatedName}
                onChange={(e) => setUpdatedName(e.target.value)}
              />
              <label>Email:</label>
              <input
                type="email"
                value={updatedEmail}
                onChange={(e) => setUpdatedEmail(e.target.value)}
              />
              <label>Faculty:</label>
              <input
                type="text"
                value={updatedFaculty}
                onChange={(e) => setUpdatedFaculty(e.target.value)}
              />
              <button
                onClick={handleUpdate}
                className="btn-save"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => setEditing(false)} className="btn-cancel">
                Cancel
              </button>
            </>
          ) : (
            <>
              <p>
                <strong>Name:</strong> {userData.name}
              </p>
              <p>
                <strong>Email:</strong> {userData.email}
              </p>
              <p>
                <strong>Faculty:</strong> {userData.faculty}
              </p>
              <button onClick={() => setEditing(true)} className="btn-edit">
                Edit Profile
              </button>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="btn-edit"
              >
                Change Password
              </button>
            </>
          )}
        </div>
      </div>

      {/* Password Update Modal */}
      {isPasswordModalOpen && (
        <div className="password-modal">
          <div className="modal-content">
            <h3>Change Password</h3>
            <label>Current Password:</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <label>New Password:</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <label>Confirm New Password:</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
            {passwordUpdateError && (
              <p className="error-message">{passwordUpdateError}</p>
            )}
            {passwordUpdateMessage && (
              <p className="success-message">{passwordUpdateMessage}</p>
            )}
            <button onClick={handlePasswordUpdate} className="btn-save">
              Update Password
            </button>
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="btn-cancel"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
