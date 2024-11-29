// src/components/FormSubmit.tsx

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { formService } from "../services/formService";
import NotificationBanner from "./NotificationBanner";
import LoadingSpinner from "./LoadingSpinner";
import Button from "./Button";
import "./FormSubmit.css";
import { FormTemplate, NotificationPayload, SubmittedForm } from "./types";

interface FormSubmitProps {
  formId: string;
  userId: string;
  onSubmitSuccess: () => void;
  formTemplate: FormTemplate;
  existingFormData?: SubmittedForm; // New prop for resubmission
}

const FormSubmit: React.FC<FormSubmitProps> = ({
  formId,
  userId,
  onSubmitSuccess,
  formTemplate,
  existingFormData,
}) => {
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<NotificationPayload | null>(
    null
  );

  // Define validation functions
  const validationRules: { [key: string]: (value: any) => string | null } = {
    required: (value: any) => (value ? null : "This field is required"),
    email: (value: any) =>
      /\S+@\S+\.\S+/.test(value) ? null : "Invalid email address",
    number: (value: any) =>
      !isNaN(Number(value)) ? null : "Must be a valid number",
    // Add more validation rules as needed
  };

  // Initialize form data with default values or existing data
  useEffect(() => {
    const initialData: { [key: string]: any } = {};
    if (formTemplate?.studentFields) {
      Object.keys(formTemplate.studentFields).forEach((key) => {
        initialData[key] = existingFormData ? existingFormData[key] || "" : "";
      });
    }
    setFormData(initialData);
    setLoading(false); // Set loading to false after initializing
  }, [formTemplate, existingFormData]);

  // Handle input changes
  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation
    if (errors[name]) {
      validateField(name, value);
    }
  };

  // Validate individual field
  const validateField = (name: string, value: any): void => {
    const field = formTemplate.studentFields[name];
    if (!field) return;

    let error: string | null = null;

    if (field.required && !value) {
      error = "This field is required";
    }

    if (field.validation) {
      for (const rule of field.validation) {
        const validate = validationRules[rule];
        if (validate) {
          const validationError = validate(value);
          if (validationError) {
            error = validationError;
            break;
          }
        }
      }
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // Validate the entire form
  const validateForm = (): boolean => {
    if (!formTemplate || !formTemplate.studentFields) return false;

    const newErrors: { [key: string]: string | null } = {};

    Object.keys(formTemplate.studentFields).forEach((key) => {
      const field = formTemplate.studentFields![key];
      const value = formData[key];

      if (field.required && !value) {
        newErrors[key] = "This field is required";
        return;
      }

      if (field.validation) {
        for (const rule of field.validation) {
          const validate = validationRules[rule];
          if (validate) {
            const error = validate(value);
            if (error) {
              newErrors[key] = error;
              break;
            }
          }
        }
      }

      newErrors[key] = newErrors[key] || null; // No errors
    });

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === null);
  };

  // Handle form submission
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!formTemplate) {
      setNotification({
        id: `notification-${Date.now()}`,
        type: "error",
        message: "Form template not loaded. Cannot submit form.",
        timestamp: new Date(),
        recipientId: userId,
      });
      return;
    }

    if (!validateForm()) {
      setNotification({
        id: `notification-${Date.now()}`,
        type: "error",
        message: "Please correct the errors before submitting.",
        timestamp: new Date(),
        recipientId: userId,
      });
      return;
    }

    try {
      setLoading(true);
      const submissionData = {
        formTemplateId: formId,
        formType: formTemplate.name,
        submittedBy: userId,
        ...formData,
      };

      if (existingFormData) {
        // Resubmission
        await formService.resubmitForm(existingFormData.formID, submissionData);
        setNotification({
          id: `notification-${Date.now()}`,
          type: "success",
          message: "Form resubmitted successfully!",
          timestamp: new Date(),
          recipientId: userId,
        });
      } else {
        // New submission
        await formService.submitForm(submissionData);
        setNotification({
          id: `notification-${Date.now()}`,
          type: "success",
          message: "Form submitted successfully!",
          timestamp: new Date(),
          recipientId: userId,
        });
      }

      setFormData({}); // Clear form data after submission

      // Re-initialize formData based on formTemplate.studentFields
      const resetData: { [key: string]: any } = {};
      Object.keys(formTemplate.studentFields).forEach((key) => {
        resetData[key] = "";
      });
      setFormData(resetData);

      // Trigger parent callback
      onSubmitSuccess();
    } catch (error) {
      console.error("Failed to submit form:", error);
      setNotification({
        id: `notification-${Date.now()}`,
        type: "error",
        message: "Error submitting form. Please try again.",
        timestamp: new Date(),
        recipientId: userId,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-submit-container">
      {notification && (
        <NotificationBanner
          notification={notification}
          onClose={() => setNotification(null)}
        />
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <h1>{formTemplate?.name || "Form Submission"}</h1>

          {existingFormData?.comments && (
            <div className="faculty-comments">
              <h3>Faculty Comments:</h3>
              <p>{existingFormData.comments}</p>
            </div>
          )}

          {formTemplate ? (
            <form onSubmit={handleSubmit} className="dynamic-form">
              {Object.keys(formTemplate.studentFields || {}).map((key) => {
                const field = formTemplate.studentFields![key];
                return (
                  <div key={key} className="form-group">
                    <label htmlFor={key}>
                      {field.label}
                      {field.required && <span className="required">*</span>}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        id={key}
                        name={key}
                        value={formData[key] || ""}
                        onChange={handleChange}
                        required={field.required}
                        className={errors[key] ? "input-error" : ""}
                        placeholder={`Enter ${field.label}`}
                      />
                    ) : field.type === "select" ? (
                      <select
                        id={key}
                        name={key}
                        value={formData[key] || ""}
                        onChange={handleChange}
                        required={field.required}
                        className={errors[key] ? "input-error" : ""}
                      >
                        <option value="">Select an option</option>
                        {field.options &&
                          field.options.map((option: string) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <input
                        id={key}
                        type={field.type}
                        name={key}
                        value={formData[key] || ""}
                        onChange={handleChange}
                        required={field.required}
                        className={errors[key] ? "input-error" : ""}
                        placeholder={`Enter ${field.label}`}
                      />
                    )}
                    {errors[key] && <p className="error-text">{errors[key]}</p>}
                  </div>
                );
              })}
              <Button
                type="submit"
                text={existingFormData ? "Resubmit" : "Submit"}
              />
            </form>
          ) : (
            <p>Error: Form template could not be loaded.</p>
          )}
        </>
      )}
    </div>
  );
};

export default FormSubmit;
