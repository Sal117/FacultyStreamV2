// src/components/FormCreate.tsx

import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import "./FormCreate.css";
import { formService } from "../services/formService";
import {
  FormTemplate,
  FormField as TemplateFormField,
  FormField,
} from "./types"; // UPDATED import
import Button from "./Button";
import {
  getFirestore,
  collection,
  getDocs,
  QuerySnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { firebaseApp } from "../services/firebase";
import { authService, CustomUser } from "../services/authService";

// Import toast from react-toastify
import { toast } from "react-toastify";

interface FormCreateProps {
  onFormCreated: () => void;
  initialData?: FormTemplate;
  isEditMode?: boolean;
}

interface FormFieldInput {
  id: string;
  label: string;
  type: string;
  options?: string[];
  validation: string[];
  required: boolean;
  visibility: "student" | "faculty" | "both";
  description?: string;
  accept?: string; //  - to specify allowed file types if type=file
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
          label: (field as FormField).label,
          type: (field as FormField).type,
          options: (field as FormField).options,
          validation: (field as FormField).validation || [],
          required: (field as FormField).required ?? false,
          visibility: initialData.facultyFields?.[key] ? "both" : "student",
          description:
            (initialData.studentFields![key] as any).description || "",
          accept: (field as FormField).accept, //  - carry over accept if editing
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
  const [loading, setLoading] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null);

  const db = getFirestore(firebaseApp);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user: CustomUser | null = await authService.getCurrentUser();
        if (!user || user.role !== "admin") {
          // Show error toast
          toast.error("You are not authorized to create form templates.");
          return;
        }
        setCurrentUser(user);
      } catch (err) {
        console.error("Error fetching current user:", err);
        // Show error toast
        toast.error("Failed to authenticate user. Please try again.");
      }
    };

    fetchCurrentUser();
  }, []);

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
        // Show error toast
        toast.error("Failed to load faculty members. Please try again later.");
      }
    };

    fetchFaculty();
  }, [db]);

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

  const removeField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Remove existing error and success state management
    // setError(null);
    // setSuccessMessage(null);

    if (!formName.trim()) {
      // Show error toast
      toast.error("Form name is required.");
      return;
    }

    if (fields.length === 0) {
      // Show error toast
      toast.error("At least one form field is required.");
      return;
    }

    const fieldLabels = new Set<string>();

    for (let field of fields) {
      if (!field.label.trim()) {
        // Show error toast
        toast.error("All fields must have a label.");
        return;
      }
      if (fieldLabels.has(field.label.trim().toLowerCase())) {
        // Show error toast
        toast.error(
          `Duplicate field label found: "${field.label}". Labels must be unique.`
        );
        return;
      }
      fieldLabels.add(field.label.trim().toLowerCase());

      if (!field.type) {
        // Show error toast
        toast.error("All fields must have a type.");
        return;
      }
      if (
        field.type === "select" &&
        (!field.options || field.options.length === 0)
      ) {
        // Show error toast
        toast.error(
          `Select field "${field.label}" must have at least one option.`
        );
        return;
      }
    }

    if (selectedResponsibleParties.length === 0) {
      // Show error toast
      toast.error("At least one responsible party must be selected.");
      return;
    }

    if (!currentUser) {
      // Show error toast
      toast.error("Authenticated user not found.");
      return;
    }

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

      //  - If it's a file field and we have 'accept'
      if (field.type === "file" && field.accept) {
        fieldData.accept = field.accept;
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

    const templateData: Omit<FormTemplate, "id"> = {
      name: formName,
      description: formDescription,
      fields: {},
      studentFields: studentFields,
      facultyFields: facultyFields,
      createdAt: new Date(),
      createdBy: currentUser.uid,
      responsibleParties: selectedResponsibleParties,
      availableToStudents: availableToStudents,
    };

    try {
      setLoading(true);
      if (isEditMode && initialData) {
        await formService.updateFormTemplate(initialData.id, templateData);
        // Show success toast
        toast.success("Form template updated successfully!");
      } else {
        await formService.createFormTemplate(templateData);
        // Show success toast
        toast.success("Form template created successfully!");
      }
      // Reset form fields
      setFormName("");
      setFormDescription("");
      setFields([]);
      setSelectedResponsibleParties([]);
      setAvailableToStudents(false);
      onFormCreated();
    } catch (err) {
      console.error("Error creating/updating form template:", err);
      // Show error toast
      toast.error(
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

      {/* Removed inline error and success messages */}

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
                  <option value="checkbox">Check Box</option>
                  <option value="file">File</option> {/*  - Add file type */}
                </select>
              </div>

              {field.type === "file" && (
                <div className="form-group">
                  <label>Accepted File Types (optional):</label>
                  <input
                    type="text"
                    value={field.accept || ""}
                    onChange={(e) =>
                      updateField(field.id, "accept", e.target.value)
                    }
                    placeholder='e.g. "image/*" or ".pdf"'
                  />
                  <small>
                    Specify allowed file types (MIME types or file extensions).
                  </small>
                </div>
              )}

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
                </select>
                <small>Select applicable validation rules.</small>
              </div>

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

          <Button type="button" text="Add Field" onClick={addField} />
        </div>

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
