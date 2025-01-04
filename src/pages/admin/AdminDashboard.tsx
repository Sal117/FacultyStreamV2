// src/pages/admin/AdminDashboard.tsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { notificationService } from "../../services/notificationService";
import { announcementService } from "../../services/announcementService";
import {
  getAllStudents,
  getAllFaculties,
  getAllFacilities,
} from "../../services/databaseService";
import LoadingSpinner from "../../components/LoadingSpinner";
import Sidebar from "../../components/Sidebar";
import Card from "../../components/Card";
import NotificationBanner from "../../components/NotificationBanner";
import AnnouncementCard from "../../components/AnnouncementCard";
import CreateAnnouncementForm from "../../components/CreateAnnouncementForm";
import EditAnnouncementForm from "../../components/EditAnnouncementForm";
import UserManagement from "../../components/UserManagement";
import AddUserForm from "../../components/AddUserForm";
import Modal from "../../components/Modal";
import { Notification } from "../../services/notificationService";
import { Announcement } from "../../components/types";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/AdminDashboard.css";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [
          studentsData,
          facultiesData,
          facilitiesData,
          notificationsData,
          announcementsData,
        ] = await Promise.all([
          getAllStudents(),
          getAllFaculties(),
          getAllFacilities(),
          notificationService.getNotifications(user.uid),
          announcementService.getAllAnnouncements(),
        ]);

        setStudents(studentsData);
        setFaculties(facultiesData);
        setFacilities(facilitiesData);
        setNotifications(notificationsData);
        setAnnouncements(announcementsData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up real-time subscriptions
    const unsubscribeAnnouncements =
      announcementService.subscribeToAnnouncements(
        (announcements: Announcement[]) => {
          setAnnouncements(announcements);
        }
      );

    const unsubscribeNotifications =
      notificationService.subscribeToUserNotifications(
        user?.uid || "",
        (notifications: Notification[]) => {
          setNotifications(notifications);
        }
      );

    return () => {
      if (unsubscribeAnnouncements) unsubscribeAnnouncements();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, [user]);

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncementToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!announcementToDelete) return;
    try {
      await announcementService.deleteAnnouncement(announcementToDelete);
      setAnnouncements(
        announcements.filter((a) => a.announcementId !== announcementToDelete)
      );
      setIsDeleteModalOpen(false);
      setAnnouncementToDelete(null);
      toast.success("Announcement deleted successfully");
    } catch (error) {
      console.error("Failed to delete announcement:", error);
      toast.error("Failed to delete announcement");
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowEditModal(true);
  };

  const handleUpdateAnnouncement = async (
    updatedData: Partial<Announcement>
  ) => {
    if (!selectedAnnouncement?.announcementId) return;
    try {
      await announcementService.updateAnnouncement(
        selectedAnnouncement.announcementId,
        updatedData
      );
      setSelectedAnnouncement(null);
      setShowEditModal(false);
      toast.success("Announcement updated successfully");
    } catch (error) {
      console.error("Failed to update announcement:", error);
      toast.error("Failed to update announcement");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <ToastContainer />

        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          {user && (
            <div className="welcome-text admin-welcome">
              Welcome back, {user.name || "Administrator"}. Monitor and manage
              your institution's activities.
            </div>
          )}
        </div>

        {error && (
          <NotificationBanner
            notification={{
              id: "error",
              type: "error",
              message: error,
              timestamp: new Date(),
              read: false,
            }}
            onClose={() => setError(null)}
          />
        )}

        <section className="dashboard-section system-overview">
          <h2>System Overview</h2>
          <div className="overview-cards">
            <div className="overview-card">
              <h3>Students</h3>
              <p className="total">
                Total: <span>{students.length}</span>
              </p>
              <div className="badge student">Student</div>
            </div>
            <div className="overview-card">
              <h3>Faculty</h3>
              <p className="total">
                Total: <span>{faculties.length}</span>
              </p>
              <div className="badge faculty">Faculty</div>
            </div>
            <div className="overview-card">
              <h3>Facilities</h3>
              <p className="total">
                Total: <span>{facilities.length}</span>
              </p>
              <div className="badge facility">Facility</div>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <h2>Notifications</h2>
          <div className="notifications-list">
            {notifications.map((notification) => (
              <NotificationBanner
                key={notification.id}
                notification={{
                  ...notification,
                  timestamp: notification.timestamp.toDate(),
                }}
                onClose={() =>
                  notificationService.clearNotification(notification.id)
                }
              />
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <h2>Announcements</h2>
          <CreateAnnouncementForm />
          <div className="announcements-list">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.announcementId}
                announcement={announcement}
                onEdit={() => handleEditAnnouncement(announcement)}
                onDelete={() =>
                  handleDeleteAnnouncement(announcement.announcementId)
                }
              />
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <h2>User Management</h2>
          <AddUserForm />
          <UserManagement />
        </section>

        {/* Modals */}
        {selectedAnnouncement && (
          <Modal
            title="Edit Announcement"
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            size="large"
          >
            <EditAnnouncementForm
              announcement={selectedAnnouncement}
              onUpdate={handleUpdateAnnouncement}
              onCancel={() => setShowEditModal(false)}
            />
          </Modal>
        )}

        <Modal
          title="Confirm Deletion"
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
          confirmText="Delete"
          cancelText="Cancel"
          showActions={true}
        >
          <p>Are you sure you want to delete this announcement?</p>
        </Modal>
      </main>
    </div>
  );
};

export default AdminDashboard;
