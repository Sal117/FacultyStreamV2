import React, { useState } from "react";
import "./FormSelector.css";

interface Document {
  documentId: string;
  title: string;
  description: string;
  fileUrl: string;
  category: string;
  createdAt: string;
  createdBy: string;
}

interface FormSelectorProps {
  forms: Document[];
  onSelectForm: (form: Document) => void;
}

const FormSelector: React.FC<FormSelectorProps> = ({ forms, onSelectForm }) => {
  const [selectedFormId, setSelectedFormId] = useState<string>("");

  const handleFormSelection = (form: Document) => {
    setSelectedFormId(form.documentId);
    onSelectForm(form);
  };

  return (
    <div className="form-selector">
      <h2>Select a Form</h2>
      {forms.length === 0 ? (
        <p className="no-forms">No forms available.</p>
      ) : (
        <ul className="form-list">
          {forms.map((form) => (
            <li
              key={form.documentId}
              className={`form-item ${
                selectedFormId === form.documentId ? "selected" : ""
              }`}
              onClick={() => handleFormSelection(form)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleFormSelection(form);
              }}
              tabIndex={0} // Makes the list item focusable
              role="button" // Indicates it's clickable
              aria-selected={selectedFormId === form.documentId}
            >
              <strong>{form.title}</strong>
              <p>{form.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FormSelector;
