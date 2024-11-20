import React, { useEffect, useState } from "react";
import { notificationService } from "../../services/notificationService";
import "../../styles/NotificationsPage.css";
import { Timestamp } from "firebase/firestore";

type Notification = {
  id: string;
  message: string;
  type: "info" | "alert" | "update" | "success" | "error";
  timestamp: Timestamp; // Firestore Timestamp
  userId?: string; // Optional userId for filtering notifications
  relatedFormId?: string; // Optional form linkage
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // To handle loading state

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(
      (newNotifications: Notification[]) => {
        setNotifications(newNotifications);
        setLoading(false); // Set loading to false after fetching notifications
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDelete = async (notificationId: string) => {
    try {
      if (
        window.confirm("Are you sure you want to delete this notification?")
      ) {
        await notificationService.clearNotification(notificationId);
        setNotifications(
          notifications.filter(
            (notification) => notification.id !== notificationId
          )
        );
      }
    } catch (error) {
      console.error("Error deleting notification", error);
    }
  };

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <div className="notifications-page">
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
    </div>
  );
};

export default NotificationsPage;
