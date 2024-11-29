// src/components/NotificationBanner.tsx

import React, { useEffect, useState } from "react";
import "./NotificationBanner.css";
import { NotificationPayload } from "./types"; // Adjust the import path as necessary
import { useNavigate } from "react-router-dom"; // Import useNavigate

interface NotificationBannerProps {
  notification: NotificationPayload;
  onClose: (id: string) => void;
  onAction?: (notification: NotificationPayload) => void;
  actionLabel?: string;
  recipientId?: string;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onClose,
  onAction,
  actionLabel,
}) => {
  const [show, setShow] = useState<boolean>(true);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleClose = () => {
    setShow(false);
    onClose(notification.id);
  };

  const handleAction = () => {
    if (onAction) {
      onAction(notification);
    } else if (notification.relatedConversationId) {
      // Navigate to the chat page with the conversation ID
      navigate(`/chat?conversationId=${notification.relatedConversationId}`);
    }
    handleClose();
  };

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        handleClose();
      }, 15000); // Auto-close after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className={`notification-banner ${notification.type}`}>
      <div className="notification-content" onClick={handleAction}>
        <span className="message">{notification.message}</span>
        {notification.timestamp && (
          <span className="timestamp">
            {notification.timestamp.toLocaleString()}
          </span>
        )}
      </div>
      <div className="notification-actions">
        {onAction && actionLabel && (
          <button onClick={handleAction} className="action-btn">
            {actionLabel}
          </button>
        )}
        <button onClick={handleClose} className="close-btn">
          &times;
        </button>
      </div>
    </div>
  );
};

export default NotificationBanner;
