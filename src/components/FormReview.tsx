// src/components/FormReview.tsx

import React, { useState, useEffect } from "react";
import "./FormReview.css";
import { formService } from "../services/formService";
import { FormTemplate, SubmittedFormData, SubmittedForm, User } from "./types";
import Button from "./Button"; // Importing the custom Button component

interface FormReviewProps {
  formId: string;
  formData: SubmittedFormData;
  formTemplate: FormTemplate;
  onDecision: (decision: "approved" | "rejected", comments: string) => void;
}

const FormReview: React.FC<FormReviewProps> = ({
  formId,
  formData,
  formTemplate,
  onDecision,
}) => {
  const [comments, setComments] = useState<string>("");
  const [facultyInputs, setFacultyInputs] = useState<{ [key: string]: any }>(
    formData.facultyData || {}
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [student, setStudent] = useState<User | null>(null);

  // Fetch student details to display user-friendly information
  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const fetchedUser = await formService.getUserById(formData.submittedBy);
        if (fetchedUser) {
          setStudent(fetchedUser);
        }
      } catch (error) {
        console.error("Error fetching student details:", error);
      }
    };

    fetchStudentDetails();
  }, [formData.submittedBy]);

  // Validate faculty inputs based on form template
  const validateFacultyInputs = (): boolean => {
    for (const key of Object.keys(formTemplate.facultyFields)) {
      const field = formTemplate.facultyFields[key];
      if (field.required && !facultyInputs[key]?.trim()) {
        setErrorMessage(`Please fill in the "${field.label}" field.`);
        return false;
      }
    }
    setErrorMessage(null);
    return true;
  };

  // Handle decision to approve or reject the form
  const handleDecision = async (decision: "approved" | "rejected") => {
    if (decision === "rejected" && !comments.trim()) {
      setErrorMessage("Please provide a reason for rejection.");
      return;
    }

    if (!validateFacultyInputs()) {
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      // Submit faculty inputs and update form status
      await formService.reviewAndUpdateForm(
        formId,
        decision,
        comments,
        facultyInputs
      );

      // Notify parent component of the decision
      onDecision(decision, comments);

      // Display success message
      setSuccessMessage(`Form has been ${decision} successfully.`);
    } catch (error) {
      console.error(`Failed to ${decision} form:`, error);
      setErrorMessage(
        `An error occurred while trying to ${decision} the form. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-review">
      <h2>Form Review</h2>

      {/* Display Success Message */}
      {successMessage && (
        <div className="success-message">
          <p>{successMessage}</p>
        </div>
      )}

      {/* Display Error Message */}
      {errorMessage && (
        <div className="error-message">
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Student's Data */}
      <div className="form-details">
        <h3>Student's Data</h3>
        {student ? (
          <div className="student-info">
            <p>
              <strong>Name:</strong> {student.name}
            </p>
            <p>
              <strong>Email:</strong> {student.email}
            </p>
            {/* Add more user-friendly details as needed */}
          </div>
        ) : (
          <p>Loading student details...</p>
        )}
        {Object.keys(formTemplate.studentFields).map((key) => (
          <div key={key} className="form-field">
            <strong>{formTemplate.studentFields[key].label}:</strong>{" "}
            {formData[key]}
          </div>
        ))}
      </div>

      {/* Faculty Inputs */}
      <div className="faculty-inputs">
        <h3>Faculty Feedback</h3>
        {Object.keys(formTemplate.facultyFields).map((key) => {
          const field = formTemplate.facultyFields[key];
          const inputValue = facultyInputs[key] || "";

          return (
            <div key={key} className="form-field">
              <label htmlFor={key}>
                {field.label}
                {field.required && <span className="required">*</span>}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  id={key}
                  name={key}
                  value={inputValue}
                  onChange={(e) =>
                    setFacultyInputs({
                      ...facultyInputs,
                      [key]: e.target.value,
                    })
                  }
                  className={errorMessage ? "input-error" : ""}
                  rows={4}
                />
              ) : (
                <input
                  id={key}
                  type={field.type}
                  name={key}
                  value={inputValue}
                  onChange={(e) =>
                    setFacultyInputs({
                      ...facultyInputs,
                      [key]: e.target.value,
                    })
                  }
                  className={errorMessage ? "input-error" : ""}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Comments Section (for rejection reasons) */}
      {(formData.status === "rejected" || formData.status === "pending") && ( // Show comments for both pending and rejected
        <div className="form-group">
          <label htmlFor="comments">
            {formData.status === "rejected"
              ? "Reason for Rejection:"
              : "Additional Comments:"}
            <span className="required">*</span>
          </label>
          <textarea
            id="comments"
            className="comments"
            placeholder={
              formData.status === "rejected"
                ? "Provide reasons for rejection..."
                : "Provide additional comments..."
            }
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            required={formData.status === "rejected"}
            rows={3}
          />
        </div>
      )}

      {/* Actions */}
      <div className="actions">
        <Button
          type="button"
          text={loading ? "Approving..." : "Approve"}
          onClick={() => handleDecision("approved")}
          variant="success"
          size="medium"
          disabled={loading}
        />
        <Button
          type="button"
          text={loading ? "Rejecting..." : "Reject"}
          onClick={() => handleDecision("rejected")}
          variant="danger"
          size="medium"
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default FormReview;
