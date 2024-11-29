import React, { useState, useEffect } from "react";
import {
  getCurrentUser,
  updateUserProfile,
  changeUserPassword,
} from "../../services/authService";
import { storageService } from "../../services/storageService";
import profilePic from "../../assets/images/profile_placeholder.webp";
import "../../styles/ProfilePage.css";
import { ThemeProvider } from "../../components/theme-provider";

const ProfilePage: React.FC = () => {
  const [userData, setUserData] = useState<any>({});
  const [editing, setEditing] = useState<boolean>(false);
  const [updatedName, setUpdatedName] = useState<string>("");
  const [updatedEmail, setUpdatedEmail] = useState<string>("");
  const [updatedFaculty, setUpdatedFaculty] = useState<string>("");
  const [updatedPhoneNumber, setUpdatedPhoneNumber] = useState<string>("");
  const [updatedAddress, setUpdatedAddress] = useState<string>("");
  const [profilePicture, setProfilePicture] = useState<string | null>(
    profilePic
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [DOB, setDOB] = useState<string>(""); // Initialize DOB state

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
      console.log("Fetched user data on reload:", user);
      if (user) {
        setUserData(user);
        setUpdatedName(user.name || "");
        setUpdatedEmail(user.email || "");
        setUpdatedFaculty(user.faculty || "");
        setUpdatedPhoneNumber(user.phoneNumber || "");
        console.log("Phone Number State after fetch:", user.phoneNumber);
        setUpdatedAddress(user.address || "");
        console.log("Address State after fetch:", user.address);
        setProfilePicture(user.profilePicture || profilePic); // Default profile picture if empty
        setDOB(user.DOB || ""); // Add DOB
        console.log("DOB State after fetch:", user.DOB);
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
        phoneNumber: updatedPhoneNumber,
        address: updatedAddress,
        profilePicture,
        DOB, // Save DOB
      });

      setUserData({
        ...userData,
        name: updatedName,
        email: updatedEmail,
        faculty: updatedFaculty,
        phoneNumber: updatedPhoneNumber,
        address: updatedAddress,
        profilePicture,
        DOB,
      });

      setEditing(false);
    } catch (error) {
      console.error("Profile update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      try {
        setLoading(true);

        // Use userData.uid instead of userData.userId
        const uploadedUrl = await storageService.uploadFile(
          `profilePictures/${userData.uid}`,
          file,
          (progress) => {
            console.log(`Upload progress: ${progress}%`);
          }
        );

        // Set the uploaded file's URL to the state
        setProfilePicture(uploadedUrl);
        console.log("Profile picture uploaded successfully:", uploadedUrl);

        // Update Firestore with the new profile picture URL
        await updateUserProfile({ profilePicture: uploadedUrl });
        setUserData({ ...userData, profilePicture: uploadedUrl });
      } catch (error) {
        console.error("Profile picture upload failed:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmNewPassword) {
      setPasswordUpdateError("Passwords do not match.");
      return;
    }

    try {
      await changeUserPassword(currentPassword, newPassword);
      setPasswordUpdateError(null);
      setPasswordUpdateMessage("Password updated successfully!");
      setIsPasswordModalOpen(false);
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
              <label>Phone Number:</label>
              <input
                type="tel"
                value={updatedPhoneNumber}
                onChange={(e) => setUpdatedPhoneNumber(e.target.value)}
              />
              <label>Address:</label>
              <input
                type="text"
                value={updatedAddress}
                onChange={(e) => setUpdatedAddress(e.target.value)}
              />
              <label>Date of Birth:</label>
              <input
                type="date"
                value={DOB}
                onChange={(e) => setDOB(e.target.value)}
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
                <strong>Name:</strong> {userData.name || "Not provided"}
              </p>
              <p>
                <strong>Email:</strong> {userData.email || "Not provided"}
              </p>
              <p>
                <strong>Faculty:</strong> {userData.faculty || "Not provided"}
              </p>
              <p>
                <strong>Phone Number:</strong>{" "}
                {userData.phoneNumber || "Not provided"}
              </p>
              <p>
                <strong>Address:</strong> {userData.address || "Not provided"}
              </p>
              <p>
                <strong>Date of Birth:</strong> {userData.DOB || "Not provided"}
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
