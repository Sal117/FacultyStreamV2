// src/components/EditAnnouncementForm.tsx

import React, { useState, ChangeEvent, FormEvent } from "react";
import "./CreateAnnouncementForm.css";
import { Announcement } from "./types";
import { announcementService } from "../services/announcementService";
import { storageService } from "../services/storageService";
import { getCurrentUser } from "../services/authService";
import { toast } from "react-toastify";

interface EditAnnouncementFormProps {
  announcement: Announcement;
  onUpdate: (updatedAnnouncement: Announcement) => void;
  onCancel: () => void;
}

const EditAnnouncementForm: React.FC<EditAnnouncementFormProps> = ({
  announcement,
  onUpdate,
  onCancel,
}) => {
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);
  const [type, setType] = useState<"announcement" | "event">(announcement.type);
  const [date, setDate] = useState(
    announcement.date ? announcement.date.toISOString().split("T")[0] : ""
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    announcement.imageUrl || null
  );
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>(
    announcement.attachments || []
  );
  const [links, setLinks] = useState<{ label: string; url: string }[]>(
    announcement.links || []
  );
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get the current user
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      // Ensure the current user is the creator or an admin
      if (
        announcement.createdByUid !== currentUser.uid &&
        currentUser.role !== "admin"
      ) {
        throw new Error("You do not have permission to edit this announcement");
      }

      // Upload new image if present
      let imageUrl = announcement.imageUrl || "";
      if (imageFile) {
        imageUrl = await storageService.uploadFile(
          `announcements/images/${Date.now()}_${imageFile.name}`,
          imageFile
        );
      }

      // Upload new attachments if any
      let attachmentUrls: string[] = existingAttachments;
      if (attachments.length > 0) {
        const uploadPromises = attachments.map((file) =>
          storageService.uploadFile(
            `announcements/attachments/${Date.now()}_${file.name}`,
            file
          )
        );
        const newAttachments = await Promise.all(uploadPromises);
        attachmentUrls = [...attachmentUrls, ...newAttachments];
      }

      // Prepare updated announcement data
      const updatedAnnouncement: Partial<Announcement> = {
        title,
        content,
        type,
        imageUrl,
        attachments: attachmentUrls,
        links,
        date: type === "event" && date ? new Date(date) : null,
      };

      // Only include the date if it's an event and date is provided
      if (type === "event" && date) {
        updatedAnnouncement.date = new Date(date);
      } else {
        // If not an event or date not provided, set date to null
        updatedAnnouncement.date = null;
      }

      // Update announcement in Firestore
      await announcementService.updateAnnouncement(
        announcement.announcementId,
        updatedAnnouncement
      );

      // Callback to update state in parent component
      onUpdate({ ...announcement, ...updatedAnnouncement });

      // Show success message
      toast.success("Announcement updated successfully.");
    } catch (error) {
      console.error("Error updating announcement:", error);
      toast.error("Failed to update announcement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image file change
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle attachments change
  const handleAttachmentsChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  // Handle adding a new link
  const handleAddLink = () => {
    if (newLinkLabel && newLinkUrl) {
      setLinks([...links, { label: newLinkLabel, url: newLinkUrl }]);
      setNewLinkLabel("");
      setNewLinkUrl("");
    }
  };

  // Handle removing an existing attachment
  const handleRemoveAttachment = (index: number) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle removing a new attachment
  const handleRemoveNewAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle removing a link
  const handleRemoveLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="create-announcement-form">
      <h2>Edit Announcement</h2>
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <label>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Content */}
        <label>Content:</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />

        {/* Type */}
        <label>Type:</label>
        <select value={type} onChange={(e) => setType(e.target.value as any)}>
          <option value="announcement">Announcement</option>
          <option value="event">Event</option>
        </select>

        {/* Date */}
        {type === "event" && (
          <>
            <label>Event Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </>
        )}

        {/* Image */}
        <label>Image:</label>
        {imagePreviewUrl && (
          <div className="image-preview">
            <img src={imagePreviewUrl} alt="Preview" />
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleImageChange} />

        {/* Existing Attachments */}
        {existingAttachments.length > 0 && (
          <div className="existing-attachments">
            <h4>Existing Attachments:</h4>
            <ul>
              {existingAttachments.map((url, index) => (
                <li key={index}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    Attachment {index + 1}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* New Attachments */}
        <label>New Attachments:</label>
        <input
          type="file"
          multiple
          accept="application/pdf,application/msword"
          onChange={handleAttachmentsChange}
        />
        {attachments.length > 0 && (
          <ul>
            {attachments.map((file, index) => (
              <li key={index}>
                {file.name}
                <button
                  type="button"
                  onClick={() => handleRemoveNewAttachment(index)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Links */}
        <label>Links:</label>
        {links.map((link, index) => (
          <div key={index} className="link-item">
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
            <button type="button" onClick={() => handleRemoveLink(index)}>
              Remove
            </button>
          </div>
        ))}
        <div className="add-link">
          <input
            type="text"
            placeholder="Label"
            value={newLinkLabel}
            onChange={(e) => setNewLinkLabel(e.target.value)}
          />
          <input
            type="url"
            placeholder="URL"
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
          />
          <button type="button" onClick={handleAddLink}>
            Add Link
          </button>
        </div>

        {/* Submit and Cancel Buttons */}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Announcement"}
        </button>
        <button type="button" onClick={onCancel} className="btn-cancel">
          Cancel
        </button>
      </form>
    </div>
  );
};

export default EditAnnouncementForm;
