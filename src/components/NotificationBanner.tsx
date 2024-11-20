import React, { useEffect, useState } from "react";
import "./NotificationBanner.css";

interface NotificationProps {
  type: "error" | "success" | "info" | "alert" | "update";
  message: string;
  timestamp?: Date;
  onClose?: () => void; // Callback for handling close actions
  onAction?: () => void; // Optional callback for additional actions (e.g., view form)
  actionLabel?: string; // Label for the optional action button
}

const NotificationBanner: React.FC<NotificationProps> = ({
  type,
  message,
  timestamp,
  onClose,
  onAction,
  actionLabel,
}) => {
  const [show, setShow] = useState<boolean>(true);

  const handleClose = () => {
    setShow(false);
    if (onClose) onClose();
  };

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setShow(false);
      }, 5000); // Auto-close after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className={`notification-banner ${type}`}>
      <div className="notification-content">
        <span>{message}</span>
        {timestamp && (
          <span className="timestamp">{timestamp.toLocaleString()}</span>
        )}
      </div>
      <div className="notification-actions">
        {onAction && actionLabel && (
          <button onClick={onAction} className="action-btn">
            {actionLabel}
          </button>
        )}
        <button onClick={handleClose} className="close-btn">
          X
        </button>
      </div>
    </div>
  );
};

export default NotificationBanner;
