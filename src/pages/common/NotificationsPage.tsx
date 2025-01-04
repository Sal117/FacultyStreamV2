import React, { useEffect, useState } from "react";
import { notificationService } from "../../services/notificationService";
import "../../styles/NotificationsPage.css";
import { Notification } from "../../services/notificationService";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // To handle loading state
  const [open, setOpen] = useState(false); // To handle dialog state
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(null); // Track which notification to delete
  const [isDeleting, setIsDeleting] = useState(false); // Track deletion process

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(
      (newNotifications: Notification[]) => {
        setNotifications(newNotifications);
        setLoading(false); // Set loading to false after fetching notifications
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDeleteConfirm = async () => {
    if (selectedNotificationId) {
      setIsDeleting(true); // Set loading state for deletion
      try {
        await notificationService.clearNotification(selectedNotificationId);
        setNotifications(
          notifications.filter(
            (notification) => notification.id !== selectedNotificationId
          )
        );
        toast.success("Notification deleted successfully!");
        setSelectedNotificationId(null); // Clear the selected notification
        setOpen(false); // Close the dialog
      } catch (error) {
        console.error("Error deleting notification", error);
        toast.error("Failed to delete the notification.");
      } finally {
        setIsDeleting(false); // End loading state
      }
    }
  };

  const handleDelete = (notificationId: string) => {
    setSelectedNotificationId(notificationId); // Store the selected notification ID
    setOpen(true); // Open the confirmation dialog
  };

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <div className="notifications-page">
      <ToastContainer /> {/* Add ToastContainer for notifications */}
      <h1>Notifications</h1>
      {notifications.length === 0 ? (
        <p>No notifications available.</p>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification notification-${notification.type}`}
            >
              <p>{notification.message}</p>
              <button onClick={() => handleDelete(notification.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      {/* Confirmation Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)} // Close dialog on cancel
        aria-labelledby="delete-confirmation-dialog"
        aria-describedby="delete-confirmation-description"
      >
        <DialogTitle id="delete-confirmation-dialog" style={{ color: "red" }}>
          Delete Notification
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-confirmation-description">
            Are you sure you want to delete this notification? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpen(false)}
            color="secondary"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="primary"
            autoFocus
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default NotificationsPage;
