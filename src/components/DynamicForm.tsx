import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { formService } from "../services/formService"; // Ensure this service is properly implemented
import "./DynamicForm.css";

interface ValidationRule {
  (value: any): string | null;
}

interface Option {
  value: string;
  label: string;
}

interface Field {
  name: string;
  type: string;
  label: string;
  required: boolean;
  validation?: ValidationRule[];
  options?: Option[]; // Added options for select fields
}

interface FormStructure {
  id: string;
  name: string;
  fields: Field[];
}

interface FormProps {
  form: FormStructure; // Form structure type definition
  userId: string; // ID of the user filling out the form
}

const DynamicForm: React.FC<FormProps> = ({ form, userId }) => {
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize formData with empty values for each field
  useEffect(() => {
    const initialData: { [key: string]: any } = {};
    form.fields.forEach((field) => {
      initialData[field.name] = field.type === "checkbox" ? false : "";
    });
    setFormData(initialData);
    setErrors({});
  }, [form]);

  // Validation function for individual fields
  const validateField = (name: string, value: any): string | null => {
    const field = form.fields.find((field) => field.name === name);
    if (!field) return null;

    if (field.required) {
      if (field.type === "checkbox" && !value) {
        return "This field is required";
      } else if (typeof value === "string" && value.trim() === "") {
        return "This field is required";
      }
    }

    if (field.validation) {
      for (const rule of field.validation) {
        const error = rule(value);
        if (error) return error;
      }
    }

    return null;
  };

  // Handle input changes and validate on the fly
  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const target = event.target;
    const name = target.name;
    let value: any;

    if (
      target instanceof HTMLInputElement &&
      (target.type === "checkbox" || target.type === "radio")
    ) {
      value = target.checked;
    } else {
      value = target.value;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate the field on change
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Handle form submission
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // Validate all fields
    const fieldErrors: { [key: string]: string | null } = {};
    form.fields.forEach((field) => {
      fieldErrors[field.name] = validateField(field.name, formData[field.name]);
    });
    setErrors(fieldErrors);

    // Check if there are any errors
    const hasErrors = Object.values(fieldErrors).some(
      (error) => error !== null
    );
    if (hasErrors) {
      console.log("Form validation failed:", fieldErrors);
      return;
    }

    // Submit the form
    setIsSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        formID: form.id,
        formType: form.name,
        submittedBy: userId,
        submittedAt: new Date(),
        status: "pending" as const,
      };

      await formService.submitForm(submissionData);

      // Notify the user or show success message
      alert("Form submitted successfully!");
      // Reset form data to initial values
      const resetData: { [key: string]: any } = {};
      form.fields.forEach((field) => {
        resetData[field.name] = field.type === "checkbox" ? false : "";
      });
      setFormData(resetData);
      setErrors({});
    } catch (error) {
      console.error("Failed to submit form:", error);
      alert("There was an error submitting the form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render input fields based on type
  const renderField = (field: Field) => {
    switch (field.type) {
      case "textarea":
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleChange}
            required={field.required}
            className={errors[field.name] ? "input-error" : ""}
          />
        );
      case "select":
        return (
          <select
            id={field.name}
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleChange}
            required={field.required}
            className={errors[field.name] ? "input-error" : ""}
          >
            <option value="">-- Select --</option>
            {field.options &&
              field.options.map((option: Option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        );
      case "checkbox":
        return (
          <div className="checkbox-group">
            <input
              type="checkbox"
              id={field.name}
              name={field.name}
              checked={formData[field.name] || false}
              onChange={handleChange}
              required={field.required}
              className={errors[field.name] ? "input-error" : ""}
            />
            <label htmlFor={field.name}>{field.label}</label>
          </div>
        );
      default:
        return (
          <input
            type={field.type}
            id={field.name}
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleChange}
            required={field.required}
            className={errors[field.name] ? "input-error" : ""}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="dynamic-form">
      <h2>{form.name}</h2>
      {form.fields.map((field) => (
        <div key={field.name} className="form-group">
          {field.type !== "checkbox" && (
            <label htmlFor={field.name}>{field.label}</label>
          )}
          {renderField(field)}
          {errors[field.name] && (
            <p className="error-text">{errors[field.name]}</p>
          )}
        </div>
      ))}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
};

export default DynamicForm;
