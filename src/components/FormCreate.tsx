// src/components/FormCreate.tsx

import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import "./FormCreate.css";
import { formService } from "../services/formService";
import { FormTemplate, FormField as TemplateFormField } from "./types";
import { FormField } from "./types";
import Button from "./Button";
import {
  getFirestore,
  collection,
  getDocs,
  QuerySnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { firebaseApp } from "../services/firebase";
import { authService, CustomUser } from "../services/authService"; // Import CustomUser

interface FormCreateProps {
  onFormCreated: () => void; // Callback to refresh form templates list after creation
  initialData?: FormTemplate; // Initial data for editing
  isEditMode?: boolean; // Flag to indicate edit mode
}

interface FormFieldInput {
  id: string; // Unique identifier for each field
  label: string;
  type: string;
  options?: string[]; // Options for select type fields
  validation: string[]; // Validation rules
  required: boolean;
  visibility: "student" | "faculty" | "both"; // Visibility of the field
  description?: string; // Optional field description
}

const FormCreate: React.FC<FormCreateProps> = ({
  onFormCreated,
  initialData,
  isEditMode = false,
}) => {
  const [formName, setFormName] = useState<string>(initialData?.name || "");
  const [formDescription, setFormDescription] = useState<string>(
    initialData?.description || ""
  );
  const [fields, setFields] = useState<FormFieldInput[]>(
    initialData
      ? Object.entries(initialData.studentFields || {}).map(([key, field]) => ({
          id: key,
          label: field.label,
          type: field.type,
          options: field.options,
          validation: field.validation || [], // Ensure validation is always an array
          required: field.required ?? false,
          visibility: initialData.facultyFields?.[key] ? "both" : "student",
          description:
            (initialData.studentFields![key] as any).description || "",
        }))
      : []
  );
  const [availableFaculty, setAvailableFaculty] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedResponsibleParties, setSelectedResponsibleParties] = useState<
    string[]
  >(initialData?.responsibleParties || []);
  const [availableToStudents, setAvailableToStudents] = useState<boolean>(
    initialData?.availableToStudents || false
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);

  const db = getFirestore(firebaseApp);

  // Fetch the currently authenticated admin user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user: CustomUser | null = await authService.getCurrentUser();
        if (!user || user.role !== "admin") {
          setError("You are not authorized to create form templates.");
          return;
        }
        setCurrentUser(user);
      } catch (err) {
        console.error("Error fetching current user:", err);
        setError("Failed to authenticate user. Please try again.");
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch available Faculty members for assigning as responsible parties
  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const usersCollection = collection(db, "users");
        const snapshot: QuerySnapshot = await getDocs(usersCollection);
        const facultyMembers = snapshot.docs
          .filter(
            (doc: QueryDocumentSnapshot) =>
              doc.data().role === "faculty" && doc.data().isActive !== false
          )
          .map((doc: QueryDocumentSnapshot) => ({
            id: doc.id,
            name: doc.data().name || "Unnamed Faculty",
          }));
        setAvailableFaculty(facultyMembers);
      } catch (err) {
        console.error("Error fetching faculty members:", err);
        setError("Failed to load faculty members. Please try again later.");
      }
    };

    fetchFaculty();
  }, [db]);

  // Handler to add a new field
  const addField = () => {
    setFields([
      ...fields,
      {
        id: Date.now().toString(),
        label: "",
        type: "text",
        validation: [],
        required: false,
        visibility: "both",
        description: "",
      },
    ]);
  };

  // Handler to remove a field
  const removeField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  // Handler to update field properties
  const updateField = (
    id: string,
    property: keyof FormFieldInput,
    value: any
  ) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, [property]: value } : field
      )
    );
  };

  // Handler to add options for select fields
  const addOption = (fieldId: string) => {
    setFields(
      fields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              options: field.options ? [...field.options, ""] : [""],
            }
          : field
      )
    );
  };

  // Handler to update an option value
  const updateOption = (
    fieldId: string,
    optionIndex: number,
    value: string
  ) => {
    setFields(
      fields.map((field) => {
        if (field.id === fieldId && field.options) {
          const updatedOptions = [...field.options];
          updatedOptions[optionIndex] = value;
          return { ...field, options: updatedOptions };
        }
        return field;
      })
    );
  };

  // Handler to remove an option
  const removeOption = (fieldId: string, optionIndex: number) => {
    setFields(
      fields.map((field) => {
        if (field.id === fieldId && field.options) {
          const updatedOptions = field.options.filter(
            (_, idx) => idx !== optionIndex
          );
          return { ...field, options: updatedOptions };
        }
        return field;
      })
    );
  };

  // Handler for form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Basic validation
    if (!formName.trim()) {
      setError("Form name is required.");
      return;
    }

    if (fields.length === 0) {
      setError("At least one form field is required.");
      return;
    }

    const fieldLabels = new Set<string>();

    for (let field of fields) {
      if (!field.label.trim()) {
        setError("All fields must have a label.");
        return;
      }
      if (fieldLabels.has(field.label.trim().toLowerCase())) {
        setError(
          `Duplicate field label found: "${field.label}". Labels must be unique.`
        );
        return;
      }
      fieldLabels.add(field.label.trim().toLowerCase());

      if (!field.type) {
        setError("All fields must have a type.");
        return;
      }
      if (
        field.type === "select" &&
        (!field.options || field.options.length === 0)
      ) {
        setError(
          `Select field "${field.label}" must have at least one option.`
        );
        return;
      }
      // Additional validation can be added here (e.g., descriptions)
    }

    if (selectedResponsibleParties.length === 0) {
      setError("At least one responsible party must be selected.");
      return;
    }

    if (!currentUser) {
      setError("Authenticated user not found.");
      return;
    }

    // Separate fields based on visibility
    const studentFields: { [key: string]: FormField } = {};
    const facultyFields: { [key: string]: FormField } = {};

    fields.forEach((field) => {
      const key = field.label.replace(/\s+/g, "_").toLowerCase();
      const fieldData: FormField = {
        label: field.label,
        type: field.type,
        validation: field.validation,
        required: field.required,
      };

      if (field.type === "select") {
        fieldData.options = field.options;
      }

      if (field.description) {
        fieldData.description = field.description;
      }

      if (field.visibility === "student") {
        studentFields[key] = fieldData;
      } else if (field.visibility === "faculty") {
        facultyFields[key] = fieldData;
      } else {
        // both
        studentFields[key] = fieldData;
        facultyFields[key] = fieldData;
      }
    });

    // Prepare form template data
    const templateData: Omit<FormTemplate, "id"> = {
      name: formName,
      description: formDescription,
      fields: {}, // General fields if any
      studentFields: studentFields,
      facultyFields: facultyFields,
      createdAt: new Date(),
      createdBy: currentUser.uid, // Set based on the authenticated Admin's ID
      responsibleParties: selectedResponsibleParties,
      availableToStudents: availableToStudents, // Include availability
    };

    try {
      setLoading(true);
      if (isEditMode && initialData) {
        // Update existing form template
        await formService.updateFormTemplate(initialData.id, templateData);
        setSuccessMessage("Form template updated successfully!");
      } else {
        // Create new form template
        await formService.createFormTemplate(templateData);
        setSuccessMessage("Form template created successfully!");
      }
      // Reset form
      setFormName("");
      setFormDescription("");
      setFields([]);
      setSelectedResponsibleParties([]);
      setAvailableToStudents(false);
      onFormCreated(); // Refresh form templates list
    } catch (err) {
      console.error("Error creating/updating form template:", err);
      setError(
        isEditMode
          ? "Failed to update form template. Please try again."
          : "Failed to create form template. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-create">
      <h2>{isEditMode ? "Edit Form Template" : "Create New Form Template"}</h2>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          <p>{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-create-form">
        {/* Form Name */}
        <div className="form-group">
          <label htmlFor="formName">
            Form Name:<span className="required">*</span>
          </label>
          <input
            type="text"
            id="formName"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
            placeholder="Enter form name"
          />
        </div>

        {/* Form Description */}
        <div className="form-group">
          <label htmlFor="formDescription">Description:</label>
          <textarea
            id="formDescription"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={3}
            placeholder="Enter form description"
          />
        </div>

        {/* Available to Students */}
        <div className="form-group checkbox-group">
          <label htmlFor="availableToStudents">Available to Students:</label>
          <input
            type="checkbox"
            id="availableToStudents"
            checked={availableToStudents}
            onChange={(e) => setAvailableToStudents(e.target.checked)}
          />
          <small>
            Check this box if you want this form to be available to students.
          </small>
        </div>

        {/* Form Fields */}
        <div className="fields-section">
          <h3>Form Fields</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="form-field">
              {/* Field Label */}
              <div className="form-group">
                <label>
                  Label:<span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) =>
                    updateField(field.id, "label", e.target.value)
                  }
                  required
                  placeholder="Enter field label"
                />
              </div>

              {/* Field Type */}
              <div className="form-group">
                <label>
                  Type:<span className="required">*</span>
                </label>
                <select
                  value={field.type}
                  onChange={(e) =>
                    updateField(field.id, "type", e.target.value)
                  }
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="date">Date</option>
                  <option value="select">Select</option>
                  {/* Add more input types as needed */}
                </select>
              </div>

              {/* Field Description */}
              <div className="form-group">
                <label>Description:</label>
                <input
                  type="text"
                  value={field.description || ""}
                  onChange={(e) =>
                    updateField(field.id, "description", e.target.value)
                  }
                  placeholder="Enter field description (optional)"
                />
                <small>
                  Provide a description or helper text for this field.
                </small>
              </div>

              {/* Field Options (if type is select) */}
              {field.type === "select" && (
                <div className="form-group">
                  <label>
                    Options:<span className="required">*</span>
                  </label>
                  {field.options && field.options.length > 0 ? (
                    field.options.map((option, idx) => (
                      <div key={idx} className="option-item">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            updateOption(field.id, idx, e.target.value)
                          }
                          required
                          placeholder={`Option ${idx + 1}`}
                        />
                        <Button
                          type="button"
                          text="Remove"
                          onClick={() => removeOption(field.id, idx)}
                          variant="danger"
                          size="small"
                        />
                      </div>
                    ))
                  ) : (
                    <p>No options added.</p>
                  )}
                  <Button
                    type="button"
                    text="Add Option"
                    onClick={() => addOption(field.id)}
                    variant="secondary"
                    size="small"
                  />
                </div>
              )}

              {/* Validation Rules */}
              <div className="form-group">
                <label>Validation Rules:</label>
                <select
                  multiple
                  value={field.validation}
                  onChange={(e) => {
                    const selectedOptions = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value
                    );
                    updateField(field.id, "validation", selectedOptions);
                  }}
                >
                  <option value="required">Required</option>
                  <option value="email">Email</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="minLength">Minimum Length</option>
                  <option value="maxLength">Maximum Length</option>
                  {/* Add more validation rules as needed */}
                </select>
                <small>Select applicable validation rules.</small>
              </div>

              {/* Required Checkbox */}
              <div className="form-group checkbox-group">
                <label>Required:</label>
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) =>
                    updateField(field.id, "required", e.target.checked)
                  }
                />
              </div>

              {/* Field Visibility */}
              <div className="form-group">
                <label>
                  Visibility:<span className="required">*</span>
                </label>
                <select
                  value={field.visibility}
                  onChange={(e) =>
                    updateField(field.id, "visibility", e.target.value)
                  }
                  required
                >
                  <option value="both">Both Student & Faculty</option>
                  <option value="student">Student Only</option>
                  <option value="faculty">Faculty Only</option>
                </select>
              </div>

              {/* Remove Field Button */}
              <Button
                type="button"
                text="Remove Field"
                onClick={() => removeField(field.id)}
                variant="danger"
                size="small"
                className="remove-field-btn"
              />

              <hr />
            </div>
          ))}

          {/* Add Field Button */}
          <Button type="button" text="Add Field" onClick={addField} />
        </div>

        {/* Responsible Parties */}
        <div className="form-group">
          <label htmlFor="responsibleParties">
            Assign Responsible Parties:<span className="required">*</span>
          </label>
          <select
            id="responsibleParties"
            multiple
            value={selectedResponsibleParties}
            onChange={(e) => {
              const selectedOptions = Array.from(
                e.target.selectedOptions,
                (option) => option.value
              );
              setSelectedResponsibleParties(selectedOptions);
            }}
            required
          >
            {availableFaculty.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </select>
          <small>
            Select one or more faculty members responsible for this form.
          </small>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          text={
            loading
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
              ? "Update Form"
              : "Create Form"
          }
          disabled={loading}
        />
      </form>
    </div>
  );
};

export default FormCreate;
