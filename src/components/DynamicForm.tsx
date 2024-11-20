import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { formService } from "../services/formService"; // Import the form service
import "./DynamicForm.css";

interface FormProps {
  form: {
    id: string;
    name: string;
    fields: {
      name: string;
      type: string;
      label: string;
      required: boolean;
      validation?: ((value: any) => string | null)[];
    }[];
  }; // Form structure type definition
  userId: string; // ID of the user filling out the form
}

const DynamicForm: React.FC<FormProps> = ({ form, userId }) => {
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({}); // To track form field errors
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // Initialize formData with empty values for each field
    const initialData: { [key: string]: any } = {};
    form.fields.forEach((field) => {
      initialData[field.name] = "";
    });
    setFormData(initialData);
  }, [form]);

  const validateField = (name: string, value: any): string | null => {
    const field = form.fields.find((field) => field.name === name);
    if (!field) return null;

    if (field.required && !value) return "This field is required";
    if (field.validation) {
      for (const rule of field.validation) {
        const error = rule(value);
        if (error) return error;
      }
    }
    return null;
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate the field on change
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

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
        status: "pending" as const, // Ensure the status field matches the expected type
      };

      await formService.submitForm(submissionData);

      // Notify the user or show success message
      alert("Form submitted successfully!");
      setFormData({}); // Reset the form data after successful submission
    } catch (error) {
      console.error("Failed to submit form:", error);
      alert("There was an error submitting the form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="dynamic-form">
      <h2>{form.name}</h2>
      {form.fields.map((field) => (
        <div key={field.name} className="form-group">
          <label htmlFor={field.name}>{field.label}</label>
          <input
            type={field.type}
            id={field.name}
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleChange}
            required={field.required}
            className={errors[field.name] ? "input-error" : ""}
          />
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
