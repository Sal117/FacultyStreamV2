import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { formService } from "../services/formService";
import NotificationBanner from "../components/NotificationBanner";
import "./FormSubmit.css";

interface FormSubmitProps {
  formId: string; // Form ID to fetch the specific form template
  userId: string; // ID of the currently logged-in user
}

const FormSubmit: React.FC<FormSubmitProps> = ({ formId, userId }) => {
  const [formTemplate, setFormTemplate] = useState<any | null>(null); // Form template fetched from the database
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch the form template on component mount
  useEffect(() => {
    const fetchFormTemplate = async () => {
      setLoading(true);
      try {
        const template = await formService.fetchFormTemplateById(formId);
        if (!template) throw new Error("Template not found"); // Handle null case
        setFormTemplate(template);

        // Initialize form data with default values
        const initialData: { [key: string]: any } = {};
        Object.keys(template.fields).forEach((key) => {
          initialData[key] = ""; // Default value for each field
        });
        setFormData(initialData);
      } catch (error) {
        console.error("Failed to fetch form template:", error);
        setNotification(
          "Error fetching form template. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFormTemplate();
  }, [formId]);

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
  };

  // Validate the form before submission
  const validateForm = (): boolean => {
    if (!formTemplate) return false; // Ensure formTemplate is not null
    const newErrors: { [key: string]: string | null } = {};
    Object.keys(formTemplate.fields).forEach((key) => {
      const field = formTemplate.fields[key];
      if (field.required && !formData[key]) {
        newErrors[key] = "This field is required";
      }
      if (field.validation) {
        field.validation.forEach((rule: (value: any) => string | null) => {
          const error = rule(formData[key]);
          if (error) {
            newErrors[key] = error;
          }
        });
      }
    });

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === null);
  };

  // Handle form submission
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!formTemplate) {
      setNotification("Form template not loaded. Cannot submit form.");
      return;
    }

    if (!validateForm()) {
      setNotification("Please correct the errors before submitting.");
      return;
    }

    try {
      const submissionData = {
        ...formData,
        formID: formId,
        formType: formTemplate.name, // Add formType
        submittedBy: userId,
        submittedAt: new Date(),
        status: "pending" as const, // Ensure the status matches SubmittedForm type
      };

      await formService.submitForm(submissionData);
      setNotification("Form submitted successfully!");
      setFormData({}); // Clear form data after submission
    } catch (error) {
      console.error("Failed to submit form:", error);
      setNotification("Error submitting form. Please try again.");
    }
  };

  return (
    <div className="form-submit-container">
      {loading ? (
        <p>Loading form...</p>
      ) : (
        <>
          <h1>{formTemplate?.name || "Form Submission"}</h1>
          {notification && (
            <NotificationBanner
              type="info"
              message={notification}
              onClose={() => setNotification(null)}
            />
          )}
          {formTemplate ? (
            <form onSubmit={handleSubmit} className="dynamic-form">
              {Object.keys(formTemplate.fields).map((key) => {
                const field = formTemplate.fields[key];
                return (
                  <div key={key} className="form-group">
                    <label htmlFor={key}>{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea
                        id={key}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        required={field.required}
                        className={errors[key] ? "input-error" : ""}
                      />
                    ) : (
                      <input
                        id={key}
                        type={field.type}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        required={field.required}
                        className={errors[key] ? "input-error" : ""}
                      />
                    )}
                    {errors[key] && <p className="error-text">{errors[key]}</p>}
                  </div>
                );
              })}
              <button type="submit">Submit</button>
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
