import React, { useState } from "react";
import "./AddEventModal.css";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (eventData: {
    title: string;
    description: string;
    date: string;
  }) => void;
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onAddEvent,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const handleAdd = () => {
    onAddEvent({ title, description, date });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add New Event</h3>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button onClick={handleAdd}>Add Event</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default AddEventModal;
