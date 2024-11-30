// src/pages/admin/AdminDashboard.tsx

import React, { useEffect, useState } from "react";
import "../../styles/AdminDashboard.css";
import {
  getAllStudents,
  getAllFaculties,
  getAllFacilities,
} from "../../services/databaseService";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Announcement } from "../../types";
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
import { FirestoreNotification } from "../../types/notification";

const AdminDashboard: React.FC = () => {
  const [userData, setUserData] = useState<CustomUser | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<FirestoreNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const user = await authService.getCurrentUser();
        if (!user) {
          throw new Error("User not authenticated");
        }

        if (user.role !== "admin") {
          throw new Error("Access denied: Admins only");
        }

        setUserData(user);

        // Subscribe to all notifications for admin
        const unsubscribeNotifications = notificationService.subscribeToAllNotifications(
          (newNotifications) => {
            setNotifications(newNotifications);
          }
        );

        // Subscribe to announcements
        const unsubscribeAnnouncements = announcementService.subscribeToAnnouncements(
          (newAnnouncements) => {
            setAnnouncements(newAnnouncements);
          }
        );

        // Fetch other data
        const [studentsData, facultiesData, facilitiesData] = await Promise.all([
          getAllStudents(),
          getAllFaculties(),
          getAllFacilities(),
        ]);

        setStudents(studentsData);
        setFaculties(facultiesData);
        setFacilities(facilitiesData);

        return () => {
          unsubscribeNotifications();
          unsubscribeAnnouncements();
        };
      } catch (error: any) {
        console.error("Error loading dashboard data:", error);
        setError(error.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleDeleteAnnouncement = (id: string) => {
    setSelectedAnnouncementId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAnnouncement = async () => {
    if (selectedAnnouncementId) {
      try {
        await announcementService.deleteAnnouncement(selectedAnnouncementId);
        toast.success("Announcement deleted successfully");
      } catch (error) {
        console.error("Error deleting announcement:", error);
        toast.error("Failed to delete announcement");
      } finally {
        setIsDeleteModalOpen(false);
        setSelectedAnnouncementId(null);
      }
    }
  };

  const handleUpdateAnnouncement = async (id: string, updateData: Partial<Announcement>) => {
    try {
      await announcementService.updateAnnouncement(id, updateData);
      toast.success("Announcement updated successfully");
      setEditingAnnouncement(null);
    } catch (error) {
      console.error("Error updating announcement:", error);
      toast.error("Failed to update announcement");
    }
  };

  const handleDismissNotification = async (notificationId: string) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error("Error dismissing notification:", error);
      toast.error("Failed to dismiss notification");
    }
  };

  return (
    <div className="admin-dashboard">
      <ToastContainer />
      <Sidebar userRole="admin" />
      
      <div className="dashboard-main">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <div className="dashboard-header">
              <h1>Admin Dashboard</h1>
              <div className="user-welcome">
                Welcome back, {userData?.name}
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-stats">
                <div className="stat-card">
                  <h3>Students</h3>
                  <p>{students.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Faculty</h3>
                  <p>{faculties.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Facilities</h3>
                  <p>{facilities.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Notifications</h3>
                  <p>{notifications.filter(n => !n.read).length}</p>
                </div>
              </div>

              <div className="dashboard-notifications">
                <h2>System Notifications</h2>
                <div className="notifications-list">
                  {notifications.map((notification) => (
                    <NotificationBanner
                      key={notification.id}
                      notification={{
                        ...notification,
                        timestamp: notification.timestamp.toDate(),
                      }}
                      onClose={handleDismissNotification}
                    />
                  ))}
                </div>
              </div>

              <div className="dashboard-announcements">
                <h2>Announcements</h2>
                <CreateAnnouncementForm />
                <div className="announcements-list">
                  {announcements.map((announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      onDelete={() => handleDeleteAnnouncement(announcement.id)}
                      onUpdate={(updateData) => handleUpdateAnnouncement(announcement.id, updateData)}
                    />
                  ))}
                </div>
              </div>

              <div className="dashboard-users">
                <h2>User Management</h2>
                <AddUserForm />
                <UserManagement />
              </div>
            </div>

            {/* Modals */}
            <Modal
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              title="Confirm Deletion"
              onConfirm={confirmDeleteAnnouncement}
              showActions={true}
              confirmText="Delete"
              cancelText="Cancel"
            >
              <p>Are you sure you want to delete this announcement?</p>
            </Modal>

            {editingAnnouncement && (
              <Modal
                isOpen={true}
                onClose={() => setEditingAnnouncement(null)}
                title="Edit Announcement"
                size="large"
              >
                <EditAnnouncementForm
                  announcement={editingAnnouncement}
                  onUpdate={(updateData) => handleUpdateAnnouncement(editingAnnouncement.id, updateData)}
                  onCancel={() => setEditingAnnouncement(null)}
                />
              </Modal>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
