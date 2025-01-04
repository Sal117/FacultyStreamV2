// src/components/CreateAnnouncementForm.tsx

import React, { useState, ChangeEvent, FormEvent } from "react";
import "./CreateAnnouncementForm.css";
import { Announcement } from "./types";
import { announcementService } from "../services/announcementService";
import { storageService } from "../services/storageService";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/authService";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CreateAnnouncementForm: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"announcement" | "event">("announcement");
  const [date, setDate] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New state for image preview
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

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

      // Upload image if present
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await storageService.uploadFile(
          `announcements/images/${Date.now()}_${imageFile.name}`,
          imageFile
        );
      }

      // Upload attachments if any
      let attachmentUrls: string[] = [];
      if (attachments.length > 0) {
        const uploadPromises = attachments.map((file) =>
          storageService.uploadFile(
            `announcements/attachments/${Date.now()}_${file.name}`,
            file
          )
        );
        attachmentUrls = await Promise.all(uploadPromises);
      }

      // Prepare announcement data
      const announcementData: Omit<
        Announcement,
        "announcementId" | "createdAt"
      > = {
        title,
        content,
        createdByUid: currentUser.uid,
        createdByName: currentUser.name || "Admin",
        type,
        imageUrl,
        attachments: attachmentUrls,
        links,
        ...(type === "event" && date ? { date: new Date(date) } : {}),
      };

      // Add announcement to Firestore
      await announcementService.addAnnouncement(announcementData);

      // Show success message
      toast.success("Announcement created successfully!");

      // Reset the form fields
      setTitle("");
      setContent("");
      setType("announcement");
      setDate("");
      setImageFile(null);
      setAttachments([]);
      setLinks([]);
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast.error("Failed to create announcement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image file selection
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle attachment file selection
  const handleAttachmentsChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files); // Safely create an array from FileList
      setAttachments((prevAttachments) => [...prevAttachments, ...filesArray]);
    }
  };

  // Handle removing an attachment
  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Handle adding a new link
  const handleAddLink = () => {
    if (newLinkLabel && newLinkUrl) {
      setLinks([...links, { label: newLinkLabel, url: newLinkUrl }]);
      setNewLinkLabel("");
      setNewLinkUrl("");
    }
  };

  // Handle removing a link
  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  return (
    <div className="create-announcement-form">
      <ToastContainer />
      <h2>Create Announcement</h2>
      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">
            Title<span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Content */}
        <div className="form-group">
          <label htmlFor="content">
            Content<span className="required">*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
        </div>

        {/* Type */}
        <div className="form-group">
          <label>
            Type<span className="required">*</span>
          </label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="announcement"
                checked={type === "announcement"}
                onChange={() => setType("announcement")}
              />
              Announcement
            </label>
            <label>
              <input
                type="radio"
                value="event"
                checked={type === "event"}
                onChange={() => setType("event")}
              />
              Event
            </label>
          </div>
        </div>

        {/* Event Date */}
        {type === "event" && (
          <div className="form-group">
            <label htmlFor="date">
              Event Date<span className="required">*</span>
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required={type === "event"}
            />
          </div>
        )}

        {/* Image Upload */}
        <div className="form-group">
          <label htmlFor="image">Image</label>
          <label htmlFor="image" className="file-input-label">
            Choose Image
          </label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input"
          />
          {imagePreviewUrl && (
            <div className="image-preview">
              <img src={imagePreviewUrl} alt="Selected" />
            </div>
          )}
        </div>

        {/* Attachments Upload */}
        <div className="form-group">
          <label htmlFor="attachments">Attachments</label>
          <label htmlFor="attachments" className="file-input-label">
            Add Attachments
          </label>
          <input
            type="file"
            id="attachments"
            multiple
            onChange={handleAttachmentsChange}
            className="file-input"
          />
          {attachments.length > 0 && (
            <ul className="attachments-list">
              {attachments.map((file, index) => (
                <li key={index}>
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Links */}
        <div className="form-group">
          <label>Links / Buttons</label>
          <div className="link-inputs">
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
          {links.length > 0 && (
            <ul className="links-list">
              {links.map((link, index) => (
                <li key={index}>
                  <span>
                    {link.label} - {link.url}
                  </span>
                  <button type="button" onClick={() => handleRemoveLink(index)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Announcement"}
        </button>
      </form>
    </div>
  );
};

export default CreateAnnouncementForm;
