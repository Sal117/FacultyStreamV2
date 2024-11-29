// src/components/AnnouncementCard.tsx

import React from "react";
import "./AnnouncementCard.css";
import { Announcement } from "../types";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";

export interface AnnouncementCardProps {
  announcement: Announcement;
  onDelete: (id: string) => void;
  onUpdate?: (announcement: Announcement) => void;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onDelete,
  onUpdate,
}) => {
  const { currentUser } = useAuth();

  return (
    <div className="announcement-card">
      {announcement.imageUrl && (
        <div className="announcement-image">
          <img src={announcement.imageUrl} alt={announcement.title} />
        </div>
      )}

      <div className="announcement-content-wrapper">
        <div className="announcement-header">
          <h3 className="announcement-title">{announcement.title}</h3>
          <span className="announcement-date">
            {format(announcement.createdAt, "MMM dd, yyyy")}
          </span>
        </div>
        <div className="announcement-creator">
          <em>By {announcement.createdByName}</em>
        </div>

        {announcement.type === "event" && announcement.date && (
          <div className="event-date">
            <strong>Event Date:</strong>{" "}
            {format(announcement.date, "MMM dd, yyyy")}
          </div>
        )}

        <div className="announcement-content">{announcement.content}</div>

        {announcement.attachments && announcement.attachments.length > 0 && (
          <div className="announcement-attachments">
            <h4>Attachments:</h4>
            <ul>
              {announcement.attachments.map((attachmentUrl, index) => (
                <li key={index}>
                  <a
                    href={attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Attachment {index + 1}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {announcement.links && announcement.links.length > 0 && (
          <div className="announcement-links">
            {announcement.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                className="announcement-link-button"
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {currentUser && (
          <div className="announcement-actions">
            {onUpdate && (
              <button
                className="edit-button"
                onClick={() => onUpdate(announcement)}
              >
                Edit
              </button>
            )}
            <button
              className="delete-button"
              onClick={() => onDelete(announcement.id)}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementCard;
