// src/pages/admin/AdminDashboard.tsx

import React, { useEffect, useState } from "react";
import "../../styles/Dashboard.css";
import {
  getAllStudents,
  getAllFaculties,
  getAllFacilities,
} from "../../services/databaseService";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Announcement } from "../../components/types";
import NavigationBar from "../../components/NavigationBar";
import Sidebar from "../../components/Sidebar";
import UserManagement from "../../components/UserManagement";
import AddUserForm from "../../components/AddUserForm";
import NotificationBanner from "../../components/NotificationBanner";
import { notificationService } from "../../services/notificationService";
import { authService, CustomUser } from "../../services/authService";
import { announcementService } from "../../services/announcementService";
import AnnouncementCard from "../../components/AnnouncementCard";
import CreateAnnouncementForm from "../../components/CreateAnnouncementForm";
import EditAnnouncementForm from "../../components/EditAnnouncementForm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "../../components/Modal";

interface Notification {
  id: string;
  type: "success" | "error" | "info" | "alert" | "update";
  message: string;
  timestamp: Date;
  relatedFormId?: string;
  relatedAppointmentId?: string;
}

const AdminDashboard: React.FC = () => {
  const [userData, setUserData] = useState<CustomUser | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<
    string | null
  >(null);

  const userRole = "admin"; // Setting the role explicitly for Sidebar

  // Function to handle deletion
  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncementToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAnnouncement = async () => {
    if (announcementToDelete) {
      try {
        await announcementService.deleteAnnouncement(announcementToDelete);
        // Remove the announcement from state
        setAnnouncements((prevAnnouncements) =>
          prevAnnouncements.filter(
            (announcement) =>
              announcement.announcementId !== announcementToDelete
          )
        );
        toast.success("Announcement deleted successfully.");
      } catch (error) {
        console.error("Error deleting announcement:", error);
        toast.error("Failed to delete announcement. Please try again.");
      } finally {
        setIsDeleteModalOpen(false);
        setAnnouncementToDelete(null);
      }
    }
  };

  // Function to handle editing
  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
  };

  // Function to handle update after editing
  const handleUpdateAnnouncement = (updatedAnnouncement: Announcement) => {
    setAnnouncements((prevAnnouncements) =>
      prevAnnouncements.map((announcement) =>
        announcement.announcementId === updatedAnnouncement.announcementId
          ? updatedAnnouncement
          : announcement
      )
    );
    setEditingAnnouncement(null); // Close the edit form
    toast.success("Announcement updated successfully.");
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch the current authenticated user
        const user = await authService.getCurrentUser();
        if (!user) {
          throw new Error("User not authenticated");
        }

        // Ensure the user has the 'admin' role
        if (user.role !== "admin") {
          throw new Error("Access denied: Admins only");
        }

        setUserData(user);

        // Fetch related data concurrently
        const [studentsData, facultiesData, facilitiesData, announcementsData] =
          await Promise.all([
            getAllStudents(),
            getAllFaculties(),
            getAllFacilities(),
            announcementService.getAllAnnouncements(),
          ]);

        setStudents(studentsData);
        setFaculties(facultiesData);
        setFacilities(facilitiesData);
        setAnnouncements(announcementsData);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        setError(error.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Subscribe to announcements for real-time updates
    const unsubscribeAnnouncements =
      announcementService.subscribeToAnnouncements((data) => {
        setAnnouncements(data);
      });

    // Subscribe to notifications
    const unsubscribeNotifications = notificationService.subscribe(
      (newNotifications: any[]) => {
        setNotifications(
          newNotifications.map((n) => {
            return { ...n };
          })
        );
      }
    );

    return () => {
      unsubscribeAnnouncements();
      unsubscribeNotifications();
    };
  }, []);

  return (
    <div className="dashboard">
      {/* Include ToastContainer for toast notifications */}
      <ToastContainer />
      <main className="dashboard-main">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Display Error Message */}
            {error && (
              <div className="error-message">
                <NotificationBanner
                  notification={{
                    id: `error-${Date.now()}`,
                    type: "error",
                    message: error,
                    timestamp: new Date(),
                  }}
                  onClose={() => setError(null)}
                />
              </div>
            )}

            <div className="dashboard-header">
              <h1>Welcome, {userData?.name}!</h1>
              <p className="dashboard-subtitle">Admin Dashboard Overview</p>
            </div>

            <section className="stats-overview">
              <div className="stat-card">Total Students: {students.length}</div>
              <div className="stat-card">
                Total Faculty Members: {faculties.length}
              </div>
              <div className="stat-card">
                Available Facilities: {facilities.length}
              </div>
            </section>

            {/* Notifications Section */}
            <div className="dashboard-section">
              <h2>Notifications</h2>
              {notifications.map((notification) => (
                <NotificationBanner
                  key={notification.id}
                  notification={notification}
                  onClose={() =>
                    notificationService.clearNotification(notification.id)
                  }
                />
              ))}
            </div>

            {/* Announcements Section */}
            <section className="dashboard-section">
              <h2>Announcements</h2>
              {/* Create Announcement Form */}
              <CreateAnnouncementForm />
              {/* Display Announcements */}
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.announcementId}
                    announcement={announcement}
                    onDelete={handleDeleteAnnouncement}
                    onEdit={handleEditAnnouncement}
                  />
                ))
              ) : (
                <p>No announcements available.</p>
              )}
            </section>

            {/* Edit Announcement Modal */}
            {editingAnnouncement && (
              <Modal
                title="Edit Announcement"
                isOpen={true}
                onClose={() => setEditingAnnouncement(null)}
                size="large"
              >
                <EditAnnouncementForm
                  announcement={editingAnnouncement}
                  onUpdate={handleUpdateAnnouncement}
                  onCancel={() => setEditingAnnouncement(null)}
                />
              </Modal>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
              title="Confirm Deletion"
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              onConfirm={confirmDeleteAnnouncement}
              onCancel={() => setIsDeleteModalOpen(false)}
              confirmText="Delete"
              cancelText="Cancel"
              showActions={true}
            >
              <p>Are you sure you want to delete this announcement?</p>
            </Modal>

            <section className="dashboard-section">
              <h2>User Management</h2>
              <AddUserForm />
              <UserManagement />
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
